require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { EJSON } = require('bson');
const { connectDatabase } = require('../utils/database');
const { buildPlan } = require('./administrative-plan');
const update = require('../data/administrative-update-2026.json');
const models = {
  regions: require('../models/regionModel'), prefectures: require('../models/prefectureModel'),
  sousPrefectures: require('../models/sousPrefectureModel'), communes: require('../models/CommuneModel'), quartiers: require('../models/quartierModel')
};
async function snapshot(session) {
  const result = {};
  for (const [key, model] of Object.entries(models)) result[key] = await model.find().sort({ _id: 1 }).session(session || null).lean();
  return result;
}
const digest = data => crypto.createHash('sha256').update(EJSON.stringify(data, { relaxed: false })).digest('hex');
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--dry-run'].includes(arg))) throw new Error('Options acceptées : --dry-run ou --apply');
  if (args.includes('--apply') && args.includes('--dry-run')) throw new Error('Choisir --apply ou --dry-run');
  await connectDatabase();
  const before = await snapshot();
  const plan = buildPlan(before, () => new mongoose.Types.ObjectId());
  console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', update: update.id, countsAfter: plan.counts, additions: plan.operations.filter(op => op.insert).map(op => ({ collection: op.collection, name: op.insert.name })), warnings: plan.warnings }, null, 2));
  if (!args.includes('--apply')) return;
  const previous = await mongoose.connection.collection('data_updates').findOne({ _id: update.id });
  if (previous) { console.log('Mise à jour déjà appliquée ; aucune écriture.'); return; }
  const folder = path.resolve('.local/backups');
  await fs.mkdir(folder, { recursive: true, mode: 0o700 });
  const backup = path.join(folder, `${update.id}-${Date.now()}.json`);
  await fs.writeFile(backup, EJSON.stringify({ update: update.id, savedAt: new Date(), collections: before }, { relaxed: false }), { flag: 'wx', mode: 0o600 });
  console.log(`Sauvegarde complète : ${backup}`);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (await mongoose.connection.collection('data_updates').findOne({ _id: update.id }, { session })) throw new Error('Mise à jour déjà appliquée par un autre processus');
      if (digest(await snapshot(session)) !== digest(before)) throw new Error('La base a changé après la sauvegarde. Relancer la migration.');
      for (const op of plan.operations) {
        if (op.insert) await models[op.collection].create([op.insert], { session });
        else await models[op.collection].updateOne({ _id: op.id }, { $set: op.fields }, { session, runValidators: true });
      }
      await mongoose.connection.collection('data_updates').insertOne({ _id: update.id, appliedAt: new Date(), backup, counts: plan.counts, warnings: plan.warnings }, { session });
    });
    console.log('Mise à jour appliquée dans une transaction, sans suppression physique.');
  } finally { await session.endSession(); }
}
main().catch(error => { console.error(`Mise à jour interrompue : ${error.code || error.name}`); if (!error.name?.startsWith('Mongo')) console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
