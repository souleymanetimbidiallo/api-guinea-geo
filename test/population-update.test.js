const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPopulationPlan, validateCensus } = require('../scripts/population-plan');
const census = require('../data/populations-rgph4-2025.json');
const Region = require('../models/regionModel');
function fixture() {
  const data = {};
  for (const [key, rows] of [['regions', census.regions], ['prefectures', census.prefectures], ['communes', census.conakryCommunes]]) {
    data[key] = rows.map((row, i) => ({ _id: `${key}-${i}`, name: row.name, population: 42, area: 11, administrativeStatus: 'active', metricsStatus: 'legacy-unverified', sources: [{ title: 'Source administrative', url: 'https://sgg.gov.gn/', publishedAt: '2026-08-20' }] }));
  }
  data.regions.push({ _id: 'beyla-2026', name: 'Beyla', effectiveFrom: '2026-08-20' }, { _id: 'siguiri-2026', name: 'Siguiri', effectiveFrom: '2026-08-20' });
  data.prefectures.push({ _id: 'kamsar-2026', name: 'Kamsar', effectiveFrom: '2026-08-20' });
  return data;
}
function apply(data, plan) {
  const result = structuredClone(data);
  for (const op of plan.operations) Object.assign(result[op.collection].find(doc => doc._id === op.id), op.fields);
  return result;
}
test('populations : cohérence du référentiel, du total national et des 13 communes', () => {
  validateCensus(census);
  assert.equal(census.national.population, 17521167);
  assert.equal(census.conakryCommunes.reduce((sum, row) => sum + row.population, 0), 3407327);
});
test('import de 54 observations sans écraser population, superficie, statut ou périmètre', () => {
  const before = fixture(), clone = structuredClone(before), plan = buildPopulationPlan(before);
  assert.deepEqual(before, clone);
  assert.deepEqual(plan.counts, { regions: 8, prefectures: 33, communes: 13 });
  assert.equal(plan.operations.length, 54);
  for (const op of plan.operations) {
    assert.equal(op.fields.population, undefined); assert.equal(op.fields.area, undefined);
    assert.equal(op.fields.metricsStatus, undefined); assert.equal(op.fields.region, undefined);
    const observation = op.fields.populationObservations[0];
    assert.equal(observation.year, 2025); assert.equal(observation.boundaryCompatibility, 'not-assessed');
    assert.equal(observation.publicationStatus, 'preliminary'); assert.ok(observation.sourcePdfPage);
    assert.ok(op.fields.sources.some(source => source.url === 'https://sgg.gov.gn/'));
    assert.ok(op.fields.sources.some(source => source.url === census.source.url));
  }
  assert.ok(!plan.operations.some(op => ['beyla-2026', 'siguiri-2026', 'kamsar-2026'].includes(op.id)));
});
test('homonymes entre niveaux : la population de la préfecture de Siguiri n’est pas celle de la nouvelle région', () => {
  const after = apply(fixture(), buildPopulationPlan(fixture()));
  assert.equal(after.prefectures.find(doc => doc.name === 'Siguiri').populationObservations[0].population, 1718147);
  assert.equal(after.regions.find(doc => doc.name === 'Siguiri').populationObservations, undefined);
});
test('import répété : aucune nouvelle observation ni source en double', () => {
  const after = apply(fixture(), buildPopulationPlan(fixture()));
  assert.equal(buildPopulationPlan(after).operations.length, 0);
});
test('import interrompu si un nom est absent, ambigu ou désigne une création postérieure au recensement', () => {
  const missing = fixture(); missing.communes.pop(); assert.throws(() => buildPopulationPlan(missing), /Correspondance/);
  const duplicate = fixture(); duplicate.regions.push({ ...duplicate.regions[0], _id: 'duplicate' }); assert.throws(() => buildPopulationPlan(duplicate), /Correspondance/);
  const future = fixture(); future.prefectures[0].effectiveFrom = '2026-08-20'; assert.throws(() => buildPopulationPlan(future), /après le recensement/);
});
test('observations contradictoires et données sources incohérentes rejetées', () => {
  const existing = apply(fixture(), buildPopulationPlan(fixture())); existing.regions[0].populationObservations[0].population++;
  assert.throws(() => buildPopulationPlan(existing), /contradictoire/);
  const damaged = structuredClone(census); damaged.regions[0].population++;
  assert.throws(() => validateCensus(damaged), /incohérente/);
});
test('schéma MongoDB : année, périmètre, pages et source restent distincts de la valeur héritée', async () => {
  const observation = buildPopulationPlan(fixture()).operations[0].fields.populationObservations[0];
  const document = new Region({ name: 'Boké', population: 42, populationObservations: [observation] });
  await document.validate();
  const result = document.toObject();
  assert.equal(result.population, 42); assert.equal(result.populationObservations[0].population, 1628656);
  assert.equal(result.populationObservations[0].source.sha256, census.source.sha256);
  assert.equal(result.populationObservations[0].sourcePrintedPage, 26);
});
