const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPlan } = require('../scripts/administrative-plan');
const { getStats } = require('../utils/administrativeStats');
const update = require('../data/administrative-update-2026.json');
function fixture() {
  const regions = ['Boké', 'Conakry', 'Faranah', 'Kankan', 'Kindia', 'Labé', 'Mamou', 'Nzérékoré'].map((name, i) => ({ _id: `r${i}`, name, population: 100, area: 20 }));
  const prefectures = ['Boké', 'Conakry', 'Mamou', 'Kankan', 'Mandiana', 'Siguiri', 'Beyla', 'Macenta', 'Dinguiraye'].map((name, i) => ({ _id: `p${i}`, name, region: 'r3', population: 42 }));
  const parent = name => prefectures.find(p => p.name === name)._id;
  return { regions, prefectures, communes: [], quartiers: [], sousPrefectures: [
    { _id: 's0', name: 'Dialakoro', prefecture: parent('Mandiana'), population: 42 },
    { _id: 's1', name: 'Dialakoro', prefecture: parent('Dinguiraye') },
    { _id: 's2', name: 'Kamsar (urban)', prefecture: parent('Boké') },
    { _id: 's3', name: 'Sabadou-Baranama', prefecture: parent('Kankan') },
    { _id: 's4', name: 'Bankon', prefecture: parent('Siguiri') }
  ] };
}
function run(snapshot) { let n = 0; return buildPlan(snapshot, () => `new${++n}`); }
function apply(snapshot, plan) {
  const data = structuredClone(snapshot);
  for (const op of plan.operations) {
    if (op.insert) data[op.collection].push(op.insert);
    else Object.assign(data[op.collection].find(d => d._id === op.id), op.fields);
  }
  return data;
}
test('plan : 2 régions, 11 préfectures et 13 communes sourcées, sans chiffres copiés', () => {
  const before = fixture(), clone = structuredClone(before), plan = run(before);
  assert.deepEqual(before, clone);
  assert.equal(plan.operations.filter(op => op.collection === 'regions' && op.insert).length, 2);
  assert.equal(plan.operations.filter(op => op.collection === 'prefectures' && op.insert).length, 11);
  assert.equal(plan.operations.filter(op => op.collection === 'communes' && op.insert).length, 13);
  for (const op of plan.operations.filter(op => op.insert)) {
    assert.equal(op.insert.population, undefined); assert.equal(op.insert.area, undefined);
    assert.equal(op.insert.metricsStatus, 'unavailable'); assert.ok(op.insert.sources[0].url.startsWith('https://'));
  }
  assert.equal(plan.counts.regions, 10);
  assert.ok(plan.operations.every(op => !op.delete));
});
test('promotions : nom ET ancien parent, variantes, identifiants et historique conservés', () => {
  const after = apply(fixture(), run(fixture()));
  assert.equal(after.sousPrefectures.find(d => d._id === 's0').administrativeStatus, 'historical');
  assert.equal(after.sousPrefectures.find(d => d._id === 's0').population, 42);
  assert.equal(after.sousPrefectures.find(d => d._id === 's1').administrativeStatus, 'active');
  assert.equal(after.sousPrefectures.find(d => d._id === 's2').replacement.name, 'Kamsar');
  assert.equal(after.sousPrefectures.find(d => d._id === 's3').replacement.name, 'Sabadou Baranama');
  assert.equal(after.sousPrefectures.find(d => d._id === 's4').parentStatus, 'pending');
  assert.equal(after.prefectures.find(d => d.name === 'Conakry').administrativeType, 'special-zone');
  assert.equal(after.prefectures.find(d => d.name === 'Siguiri').parentStatus, 'pending');
  const doko = after.prefectures.find(d => d.name === 'Doko');
  assert.equal(doko.region, after.regions.find(d => d.name === 'Siguiri')._id);
});
test('réexécution : aucune création en double', () => {
  const after = apply(fixture(), run(fixture())), second = run(after);
  assert.equal(second.operations.filter(op => op.insert).length, 0);
});
test('ambiguïtés : interruption avant toute modification', () => {
  const data = fixture(); data.regions.push({ _id: 'duplicate', name: 'Conakry' });
  assert.throws(() => run(data), /ambigu/);
  const repeated = fixture(); repeated.sousPrefectures.push({ ...repeated.sousPrefectures[0], _id: 's5' });
  assert.throws(() => run(repeated), /ambigu/);
});
test('référentiel : les nouvelles préfectures ont des parents déclarés et la couverture est explicite', () => {
  const names = update.prefectures.map(p => p.name);
  assert.equal(new Set(names).size, 11);
  assert.equal(new Set(update.conakryCommunes).size, 13);
  assert.ok(update.prefectures.every(p => update.regions.includes(p.region) || ['Boké', 'Mamou', 'Kankan'].includes(p.region)));
  assert.ok(update.limitations.length >= 4);
});
const config = { kind: 'regions', count: 'totalRegions', most: 'mostPopulatedRegion', largest: 'largestRegion' };
const modelWith = rows => ({ find: () => ({ select: async () => rows }) });
const verified = (name, population, year, compatibility = 'verified') => ({ name, populationObservations: [{ referenceId: `test-${year}`, year, population, verificationStatus: 'verified', publicationStatus: 'final', geographicReference: 'Périmètre documenté', boundaryCompatibility: compatibility, source: { title: 'Rapport vérifié', url: 'https://www.stat-guinee.org/rapport.pdf' } }] });
test('statistiques : valeurs héritées exclues du total et des classements', async () => {
  const result = await getStats(modelWith([{ name: 'Ancien', population: 100, metricsStatus: 'verified', populationReferenceYear: 2014 }]), {}, config);
  assert.equal(result.totalRegions, 1); assert.equal(result.totalPopulation, null);
  assert.equal(result.mostPopulatedRegion, null); assert.equal(result.populationCoverage.verified, 0);
});
test('statistiques : des années différentes ne sont pas additionnées', async () => {
  const result = await getStats(modelWith([verified('A', 40, 2024), verified('B', 60, 2025)]), {}, config);
  assert.equal(result.totalPopulation, null); assert.equal(result.populationCoverage.referenceYear, null);
});
test('statistiques : périmètres non validés empêchent un total actuel', async () => {
  const result = await getStats(modelWith([verified('A', 100, 2025, 'not-assessed')]), {}, config);
  assert.equal(result.populationCoverage.verified, 1); assert.equal(result.populationCoverage.matchingCurrentBoundaries, 0);
  assert.equal(result.totalPopulation, null); assert.equal(result.mostPopulatedRegion, null);
});
test('statistiques : total et classement seulement si année, couverture et périmètres compatibles', async () => {
  const result = await getStats(modelWith([verified('A', 40, 2025), verified('B', 60, 2025)]), {}, config);
  assert.equal(result.totalPopulation, 100); assert.equal(result.populationCoverage.referenceYear, 2025);
  assert.equal(result.populationCoverage.complete, true); assert.equal(result.mostPopulatedRegion, 'B');
});
