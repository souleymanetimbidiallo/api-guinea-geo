const census = require('../data/populations-rgph4-2025.json');
const { normalize } = require('../scripts/administrative-plan');
const referenceRows = { regions: census.regions, prefectures: census.prefectures, communes: census.conakryCommunes };
const plain = value => typeof value?.toObject === 'function' ? value.toObject() : { ...value };
function validSource(source) {
  try { return ['https:', 'http:'].includes(new URL(source?.url).protocol); } catch { return false; }
}
function verifiedObservation(observation, record, kind) {
  if (!Number.isSafeInteger(observation.population) || observation.population < 0 ||
      !Number.isInteger(observation.year) || observation.year < 1900 || observation.year > new Date().getUTCFullYear() ||
      !['preliminary', 'final'].includes(observation.publicationStatus) || !validSource(observation.source)) return false;
  // Une observation antérieure à la création ne décrit pas cette nouvelle entité.
  if (record.effectiveFrom && Number(record.effectiveFrom.slice(0, 4)) > observation.year) return false;
  if (observation.referenceId === census.id) {
    const row = referenceRows[kind]?.find(value => normalize(value.name) === normalize(record.name));
    if (record.effectiveFrom && record.effectiveFrom > census.collectionPeriod.to) return false;
    return observation.publicationStatus === census.publicationStatus && observation.year === census.referenceYear && observation.source.sha256 === census.source.sha256 &&
      row?.population === observation.population && row?.male === observation.male && row?.female === observation.female;
  }
  // Les prochains imports doivent attribuer explicitement un statut de vérification.
  return observation.verificationStatus === 'verified' && typeof observation.referenceId === 'string' &&
    !!observation.referenceId && typeof observation.geographicReference === 'string' && !!observation.geographicReference;
}
function selectPopulation(value, kind) {
  const record = plain(value);
  return (record.populationObservations || []).filter(observation => verifiedObservation(observation, record, kind))
    .sort((a, b) => b.year - a.year || Number(b.publicationStatus === 'final') - Number(a.publicationStatus === 'final') ||
      String(b.source.publishedAt || '').localeCompare(String(a.source.publishedAt || '')))[0] || null;
}
function serializeRecord(value, { kind, includeHistory = false } = {}) {
  if (Array.isArray(value)) return value.map(record => serializeRecord(record, { kind, includeHistory }));
  const record = plain(value);
  const observation = selectPopulation(record, kind);
  const { population: legacyPopulation, populationReferenceYear: legacyYear, populationObservations = [], ...rest } = record;
  const result = {
    ...rest,
    population: observation?.population ?? null,
    populationReferenceYear: observation?.year ?? null,
    populationStatus: observation?.publicationStatus || 'unavailable',
    populationSource: observation ? { ...observation.source, pdfPage: observation.sourcePdfPage ?? null, printedPage: observation.sourcePrintedPage ?? null } : null,
    populationGeographicReference: observation?.geographicReference || null,
    populationBoundaryCompatibility: observation?.boundaryCompatibility || null
  };
  if (includeHistory) {
    result.populationHistory = {
      legacy: Number.isFinite(legacyPopulation) ? { population: legacyPopulation, referenceYear: legacyYear ?? null, status: record.metricsStatus || 'unverified' } : null,
      observations: populationObservations
    };
  }
  return result;
}
function populationOptionsMiddleware(req, res, next) {
  const history = req.query.includeHistory;
  if (history !== undefined && !['true', 'false'].includes(history)) {
    return res.status(400).json({ message: 'includeHistory doit valoir true ou false', code: 400 });
  }
  req.populationOptions = { includeHistory: history === 'true' };
  next();
}
module.exports = { selectPopulation, serializeRecord, populationOptionsMiddleware };
