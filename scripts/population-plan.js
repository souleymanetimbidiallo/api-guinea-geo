const census = require('../data/populations-rgph4-2025.json');
const { normalize } = require('./administrative-plan');
function validateCensus(data) {
  for (const key of ['regions', 'prefectures', 'conakryCommunes']) {
    const names = new Set();
    for (const row of data[key]) {
      if (names.has(normalize(row.name))) throw new Error(`Doublon dans le référentiel : ${row.name}`);
      names.add(normalize(row.name));
      if (![row.population, row.male, row.female].every(value => Number.isSafeInteger(value) && value >= 0) || row.male + row.female !== row.population) throw new Error(`Population incohérente : ${row.name}`);
    }
  }
  const sum = rows => rows.reduce((total, row) => total + row.population, 0);
  if (sum(data.regions) !== data.national.population || data.national.male + data.national.female !== data.national.population) throw new Error('Total national incohérent');
  for (const region of data.regions) {
    const rows = region.name === 'Conakry' ? data.conakryCommunes : data.prefectures.filter(row => row.regionAtCensus === region.name);
    if (sum(rows) !== region.population) throw new Error(`Total régional incohérent : ${region.name}`);
  }
}
function buildPopulationPlan(snapshot, data = census) {
  validateCensus(data);
  const operations = [];
  const counts = {};
  for (const [collection, rows] of [['regions', data.regions], ['prefectures', data.prefectures], ['communes', data.conakryCommunes]]) {
    counts[collection] = 0;
    for (const row of rows) {
      const matches = snapshot[collection].filter(doc => normalize(doc.name) === normalize(row.name) && doc.administrativeStatus !== 'historical');
      if (matches.length !== 1) throw new Error(`Correspondance absente ou ambiguë : ${collection}/${row.name}`);
      const doc = matches[0];
      if (doc.effectiveFrom && doc.effectiveFrom > data.collectionPeriod.to) throw new Error(`Entité créée après le recensement : ${row.name}`);
      const observation = {
        referenceId: data.id, year: data.referenceYear, publicationStatus: data.publicationStatus,
        population: row.population, male: row.male, female: row.female,
        geographicReference: data.geographicReference, boundaryCompatibility: 'not-assessed',
        regionAtCensus: row.regionAtCensus, source: data.source,
        sourcePdfPage: row.sourcePdfPage, sourcePrintedPage: row.sourcePrintedPage,
        reviewedAt: data.reviewedAt
      };
      const observations = doc.populationObservations || [];
      const existing = observations.find(value => value.referenceId === data.id);
      if (existing) {
        if (existing.population !== row.population || existing.year !== data.referenceYear || existing.male !== row.male || existing.female !== row.female) throw new Error(`Observation existante contradictoire : ${row.name}`);
      } else {
        const sources = (doc.sources || []).map(({ title, url, publishedAt }) => ({ title, url, publishedAt }));
        if (!sources.some(source => source.url === data.source.url)) sources.push({ title: data.source.title, url: data.source.url, publishedAt: data.source.publishedAt });
        operations.push({ collection, id: doc._id, name: doc.name, fields: { populationObservations: [...observations, observation], sources } });
      }
      counts[collection]++;
    }
  }
  return { operations, counts };
}
module.exports = { validateCensus, buildPopulationPlan };
