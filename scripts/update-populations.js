require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { EJSON } = require('bson');
const { connectDatabase } = require('../utils/database');
const { buildPopulationPlan } = require('./population-plan');
const census = require('../data/populations-rgph4-2025.json');
const migrationId = `${census.id}-observations-v1`;
const models = { regions: require('../models/regionModel'), prefectures: require('../models/prefectureModel'), communes: require('../models/CommuneModel') };
async function snapshot(session) {
  const result = {};
  for (const [key, model] of Object.entries(models)) result[key] = await model.find().sort({ _id: 1 }).session(session || null).lean();
  return result;
}
const digest = data => crypto.createHash('sha256').update(EJSON.stringify(data, { relaxed: false })).digest('hex');
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--dry-run'].includes(arg)) || args.length > 1) throw new Error('Choisir --dry-run ou --apply');
  await connectDatabase();
  const before = await snapshot();
  const plan = buildPopulationPlan(before);
  console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', migrationId, referenceYear: census.referenceYear, coverage: plan.counts, observationsToAdd: plan.operations.length, note: 'Observation du recensement 2025 ; aucun chiffre transféré aux nouvelles entités de 2026.' }, null, 2));
  if (!args.includes('--apply')) return;
  if (await mongoose.connection.collection('data_updates').findOne({ _id: migrationId })) { console.log('Import déjà appliqué ; aucune écriture.'); return; }
  const folder = path.resolve('.local/backups');
  await fs.mkdir(folder, { recursive: true, mode: 0o700 });
  const backup = path.join(folder, `${migrationId}-${Date.now()}.json`);
  await fs.writeFile(backup, EJSON.stringify({ migrationId, savedAt: new Date(), collections: before }, { relaxed: false }), { flag: 'wx', mode: 0o600 });
  console.log(`Sauvegarde : ${backup}`);
  // Valider tous les documents modifiés avant de commencer les écritures.
  for (const op of plan.operations) {
    const previous = before[op.collection].find(doc => String(doc._id) === String(op.id));
    await new models[op.collection]({ ...previous, ...op.fields }).validate();
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (await mongoose.connection.collection('data_updates').findOne({ _id: migrationId }, { session })) throw new Error('Import déjà appliqué par un autre processus');
      if (digest(await snapshot(session)) !== digest(before)) throw new Error('La base a changé après sauvegarde ; relancer l’import');
      for (const [collection, Model] of Object.entries(models)) {
        const ops = plan.operations.filter(op => op.collection === collection);
        if (ops.length) await Model.bulkWrite(ops.map(op => ({ updateOne: { filter: { _id: op.id }, update: { $set: op.fields } } })), { session, ordered: true });
      }
      await mongoose.connection.collection('data_updates').insertOne({ _id: migrationId, appliedAt: new Date(), backup, coverage: plan.counts, sourceSha256: census.source.sha256 }, { session });
    });
    console.log('Observations RGPH-4 intégrées ; anciennes valeurs et structure administrative conservées.');
  } finally { await session.endSession(); }
}
main().catch(error => { console.error(`Import interrompu : ${error.code || error.name}`); if (!error.name?.startsWith('Mongo')) console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
