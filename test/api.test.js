const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');
const models = [
  ['regions', require('../models/regionModel')],
  ['prefectures', require('../models/prefectureModel')],
  ['sous-prefectures', require('../models/sousPrefectureModel')],
  ['communes', require('../models/CommuneModel')],
  ['quartiers', require('../models/quartierModel')]
];
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
function query(value) {
  return { select() { return this; }, populate() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } };
}
for (const [route, model] of models) {
  test(`${route} : liste, recherche, absence et paramètres invalides`, async t => {
    const records = [{ name: 'Labé' }];
    t.mock.method(model, 'find', () => query(records));
    t.mock.method(model, 'findOne', ({ name }) => query(name.test('Labé') ? records[0] : null));
    const list = await fetch(`${base}/${route}`);
    assert.equal(list.status, 200);
    const listed = await list.json();
    assert.deepEqual(listed.map(row => row.name), ['Labé']);
    assert.equal(listed[0].population, null);
    assert.equal(listed[0].populationStatus, 'unavailable');
    const match = await fetch(`${base}/${route}/search?name=lab%C3%A9`);
    assert.equal(match.status, 200);
    const found = await match.json();
    assert.equal(found.name, 'Labé');
    assert.equal(found.population, null);
    for (const suffix of ['', '?name=', '?name=%20', '?name[x]=abc', '?name=a&name=b']) {
      const response = await fetch(`${base}/${route}/search${suffix}`);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, 400);
    }
    for (const name of ['inconnu', '.*', '[']) {
      assert.equal((await fetch(`${base}/${route}/search?name=${encodeURIComponent(name)}`)).status, 404);
    }
  });
  test(`${route} : erreur MongoDB retournée en JSON sans détails internes`, async t => {
    t.mock.method(model, 'find', () => { throw new Error('secret database detail'); });
    const response = await fetch(`${base}/${route}`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: 'Erreur serveur', code: 500 });
  });
}
test('accueil, Swagger, route inconnue et JSON invalide', async () => {
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /API Guinée Geo/);
  const docs = await fetch(`${base}/api-docs/`);
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /swagger-ui/);
  const missing = await fetch(`${base}/inconnue`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, 404);
  const invalid = await fetch(`${base}/regions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).code, 400);
});
test('connexion absente ou rejetée : échec explicite et nouvelle tentative possible', async t => {
  const mongoose = require('mongoose');
  const { connectDatabase } = require('../utils/database');
  const original = process.env.MONGO_URI;
  t.after(() => { if (original === undefined) delete process.env.MONGO_URI; else process.env.MONGO_URI = original; });
  delete process.env.MONGO_URI;
  await assert.rejects(connectDatabase(), /MONGO_URI/);
  process.env.MONGO_URI = 'mongodb://test.invalid/db';
  const connect = t.mock.method(mongoose, 'connect', async () => { throw new Error('unavailable'); });
  await assert.rejects(connectDatabase(), /unavailable/);
  await assert.rejects(connectDatabase(), /unavailable/);
  assert.equal(connect.mock.callCount(), 2);
});
for (const [route, model, countKey, mostKey, largestKey] of [
  ['regions', models[0][1], 'totalRegions', 'mostPopulatedRegion', 'largestRegion'],
  ['prefectures', models[1][1], 'totalPrefectures', 'mostPopulatedPrefecture', 'largestPrefecture']
]) {
  test(`${route} : statistiques d'une base vide`, async t => {
    t.mock.method(model, 'find', () => query([]));
    t.mock.method(model, 'aggregate', async () => []);
    t.mock.method(model, 'findOne', () => ({ sort() { return this; }, limit() { return this; }, then(resolve) { return Promise.resolve(null).then(resolve); } }));
    const response = await fetch(`${base}/${route}/stats`);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result[countKey], 0);
    assert.equal(result.totalPopulation, 0);
    assert.equal(result[mostKey], null);
    assert.equal(result[largestKey], null);
    assert.equal(result.populationCoverage.total, 0);
  });
}
test('préfectures liées à une région, puis région absente', async t => {
  const region = models[0][1], prefecture = models[1][1];
  t.mock.method(region, 'findOne', ({ name }) => query(name.test('Kankan') ? { _id: 'region-id' } : null));
  t.mock.method(prefecture, 'find', filter => {
    assert.equal(filter.region, 'region-id');
    assert.deepEqual(filter.administrativeStatus, { $ne: 'historical' });
    assert.deepEqual(filter.parentStatus, { $ne: 'pending' });
    return query([{ name: 'Siguiri' }]);
  });
  const response = await fetch(`${base}/regions/Kankan/prefectures`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result[0].name, 'Siguiri');
  assert.equal(result[0].population, null);
  assert.equal((await fetch(`${base}/regions/inconnue/prefectures`)).status, 404);
});

test('listes actives : historiques exclus, zone spéciale hors préfectures', async t => {
  t.mock.method(models[1][1], 'find', filter => {
    assert.deepEqual(filter.administrativeStatus, { $ne: 'historical' });
    assert.deepEqual(filter.administrativeType, { $ne: 'special-zone' });
    return query([]);
  });
  t.mock.method(models[2][1], 'find', filter => {
    assert.deepEqual(filter.administrativeStatus, { $ne: 'historical' });
    return query([]);
  });
  assert.equal((await fetch(`${base}/prefectures`)).status, 200);
  assert.equal((await fetch(`${base}/sous-prefectures`)).status, 200);
});
test('sources : décrets et limites disponibles publiquement', async () => {
  const response = await fetch(`${base}/data-sources`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.regions, ['Beyla', 'Siguiri']);
  assert.equal(data.prefectures.length, 11);
  assert.ok(data.limitations.length);
});
test('référentiel de population : année et périmètre 2025, total national et communes', async () => {
  const response = await fetch(`${base}/populations/rgph4-2025`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.referenceYear, 2025); assert.equal(data.publicationStatus, 'preliminary');
  assert.equal(data.national.population, 17521167);
  assert.equal(data.regions.length, 8); assert.equal(data.prefectures.length, 33); assert.equal(data.conakryCommunes.length, 13);
  assert.ok(!data.regions.some(row => ['Beyla', 'Siguiri'].includes(row.name)));
});

for (const [route, model] of models) {
  test(`${route} : valeurs héritées masquées et historique uniquement sur demande`, async t => {
    const record = { name: 'Test', population: 12345, metricsStatus: 'legacy-unverified' };
    t.mock.method(model, 'find', () => query([record]));
    t.mock.method(model, 'findOne', () => query(record));
    for (const suffix of ['', '/search?name=Test']) {
      const response = await fetch(`${base}/${route}${suffix}`);
      const data = await response.json();
      const value = Array.isArray(data) ? data[0] : data;
      assert.equal(value.population, null); assert.equal(value.populationReferenceYear, null);
      assert.equal(value.populationStatus, 'unavailable');
      assert.equal(value.populationHistory, undefined); assert.equal(value.populationObservations, undefined);
    }
    const response = await fetch(`${base}/${route}?includeHistory=true`);
    const data = await response.json();
    assert.equal(data[0].population, null);
    assert.equal(data[0].populationHistory.legacy.population, 12345);
    assert.equal(record.population, 12345);
  });
}
test('fiches et sous-listes : même population sourcée, statut et année', async t => {
  const census = require('../data/populations-rgph4-2025.json');
  const row = census.prefectures.find(value => value.name === 'Kankan');
  const record = { name: row.name, population: 42, populationObservations: [{ ...row, referenceId: census.id, year: 2025, publicationStatus: 'preliminary', source: census.source, geographicReference: census.geographicReference, boundaryCompatibility: 'not-assessed' }] };
  t.mock.method(models[0][1], 'findOne', () => query({ name: 'Kankan', _id: 'region-id' }));
  t.mock.method(models[1][1], 'find', () => query([record]));
  t.mock.method(models[1][1], 'findOne', () => query(record));
  const list = await (await fetch(`${base}/regions/Kankan/prefectures`)).json();
  const detail = await (await fetch(`${base}/prefectures/search?name=Kankan`)).json();
  assert.equal(list[0].population, 841969); assert.equal(detail.population, 841969);
  assert.equal(detail.populationReferenceYear, 2025); assert.equal(detail.populationStatus, 'preliminary');
  assert.equal(detail.populationSource.url, census.source.url);
  assert.equal(detail.populationBoundaryCompatibility, 'not-assessed');
  assert.equal(detail.populationObservations, undefined);
});
test('paramètre historique : valeurs invalides refusées avant les requêtes de données', async () => {
  for (const suffix of ['1', 'yes', 'true&includeHistory=false']) {
    const response = await fetch(`${base}/regions?includeHistory=${suffix}`);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 400);
  }
});
