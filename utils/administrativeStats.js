const { serializeRecord } = require('./populationResponse');
// La même sélection de population est utilisée pour les fiches et les statistiques.
async function getStats(Model, filter, config) {
  const records = await Model.find(filter).select('name population populationReferenceYear populationObservations effectiveFrom area metricsStatus areaReferenceYear');
  const rows = serializeRecord(records, { kind: config.kind });
  const count = rows.length;
  const verified = rows.filter(row => row.population !== null);
  const years = [...new Set(verified.map(row => row.populationReferenceYear))];
  const matching = verified.filter(row => row.populationBoundaryCompatibility === 'verified');
  const complete = count > 0 && verified.length === count && matching.length === count && years.length === 1;
  const most = complete ? verified.reduce((max, row) => row.population > max.population ? row : max) : null;
  const areas = rows.filter(row => row.metricsStatus === 'verified' && Number.isFinite(row.area));
  const largest = count > 0 && areas.length === count ? areas.reduce((max, row) => row.area > max.area ? row : max) : null;
  return {
    [config.count]: count,
    totalPopulation: count === 0 ? 0 : complete ? verified.reduce((sum, row) => sum + row.population, 0) : null,
    [config.most]: most?.name || null,
    [config.largest]: largest?.name || null,
    populationCoverage: { verified: verified.length, matchingCurrentBoundaries: matching.length, total: count, referenceYear: years.length === 1 ? years[0] : null, complete },
    note: 'Les populations sont les dernières observations vérifiées et datées. Un total n’est calculé que si la couverture, l’année et les périmètres actuels sont compatibles.'
  };
}
module.exports = { getStats };
