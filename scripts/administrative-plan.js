const update = require('../data/administrative-update-2026.json');
const normalize = name => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[-\s]+/g, ' ');
const id = value => String(value || '');
function buildPlan(snapshot, newId) {
  const state = {};
  // Préserver les références BSON utilisées par les modèles.
  for (const key of Object.keys(snapshot)) state[key] = snapshot[key].map(doc => ({ ...doc }));
  const operations = [], warnings = [];
  function find(collection, name) {
    const matches = state[collection].filter(doc => normalize(doc.name) === normalize(name));
    if (matches.length > 1) throw new Error(`Nom ambigu dans ${collection} : ${name}`);
    return matches[0];
  }
  function change(collection, doc, fields, reason) {
    operations.push({ collection, id: doc._id, fields, reason }); Object.assign(doc, fields);
  }
  function ensure(collection, name, fields) {
    let doc = find(collection, name);
    if (doc) { change(collection, doc, fields, `Actualiser ${name}`); return doc; }
    doc = { _id: newId(), name, ...fields };
    operations.push({ collection, insert: doc, reason: `Créer ${name}` }); state[collection].push(doc); return doc;
  }
  const reviewedAt = update.reviewedAt;
  for (const collection of Object.keys(state)) {
    for (const doc of state[collection]) {
      if (doc.administrativeStatus === 'historical') continue;
      const fields = { administrativeStatus: 'active', reviewedAt };
      if (!doc.metricsStatus) fields.metricsStatus = 'legacy-unverified';
      if (collection !== 'regions' && !doc.parentStatus) fields.parentStatus = 'legacy-unverified';
      change(collection, doc, fields, `Annoter les données héritées : ${doc.name}`);
    }
  }
  for (const name of update.regions) {
    const existing = find('regions', name);
    const fields = { administrativeStatus: 'active', administrativeType: 'region', effectiveFrom: update.effectiveFrom, reviewedAt, sources: [update.sources.regions], notes: 'Région créée le 20 août 2026. Périmètre et statistiques à compléter à partir des actes du MATD.' };
    if (!existing) fields.metricsStatus = 'unavailable';
    ensure('regions', name, fields);
  }
  const conakry = find('regions', 'Conakry');
  if (!conakry) throw new Error('La région de Conakry est absente');
  change('regions', conakry, { administrativeType: 'special-zone', sources: [update.sources.communes] }, 'Identifier la zone spéciale de Conakry');
  const mistaken = find('prefectures', 'Conakry');
  if (mistaken) change('prefectures', mistaken, { administrativeStatus: 'active', administrativeType: 'special-zone', replacement: { type: 'Region', name: 'Conakry' }, sources: [update.sources.communes], notes: 'Zone spéciale de Conakry, conservée séparément du décompte des préfectures ordinaires.' }, 'Retirer Conakry du décompte des préfectures sans supprimer son historique');
  for (const spec of update.prefectures) {
    const region = find('regions', spec.region);
    if (!region) throw new Error(`Région absente : ${spec.region}`);
    const previous = find('prefectures', spec.previousPrefecture);
    const existing = find('prefectures', spec.name);
    const fields = { region: region._id, administrativeStatus: 'active', administrativeType: 'prefecture', effectiveFrom: update.effectiveFrom, parentStatus: 'verified', sources: [update.sources.prefectures], reviewedAt, notes: 'Préfecture créée le 20 août 2026. Liste des subdivisions et statistiques à compléter à partir des actes du MATD.' };
    if (!existing) fields.metricsStatus = 'unavailable';
    ensure('prefectures', spec.name, fields);
    // Le nom seul ne permet pas d'identifier une ancienne sous-préfecture (ex. Dialakoro).
    const names = [spec.name, ...(spec.aliases || [])].map(normalize);
    const promoted = previous ? state.sousPrefectures.filter(doc => id(doc.prefecture) === id(previous._id) && names.includes(normalize(doc.name))) : [];
    if (promoted.length > 1) throw new Error(`Sous-préfecture ambiguë : ${spec.name}`);
    if (promoted[0]) change('sousPrefectures', promoted[0], { administrativeStatus: 'historical', replacement: { type: 'Prefecture', name: spec.name }, sources: [update.sources.prefectures], notes: 'Localité désormais répertoriée comme préfecture ; ancien enregistrement conservé pour traçabilité.' }, `Historiser la promotion de ${spec.name}`);
    else warnings.push(`Ancienne sous-préfecture non trouvée dans ${spec.previousPrefecture} : ${spec.name}`);
  }
  const affected = new Set(update.prefectures.map(spec => spec.previousPrefecture));
  const affectedIds = new Set(state.prefectures.filter(doc => affected.has(doc.name)).map(doc => id(doc._id)));
  for (const doc of state.sousPrefectures) {
    if (doc.administrativeStatus !== 'historical' && affectedIds.has(id(doc.prefecture))) {
      change('sousPrefectures', doc, { parentStatus: 'pending', notes: 'Dernier rattachement connu conservé ; rattachement actuel à vérifier après les créations de préfectures de 2026.' }, `Signaler le rattachement à vérifier : ${doc.name}`);
    }
  }
  for (const name of ['Siguiri', 'Beyla']) {
    const prefecture = find('prefectures', name);
    if (prefecture) change('prefectures', prefecture, { parentStatus: 'pending', notes: 'Dernier rattachement connu conservé. Le décret de création de la région ne détaille pas le rattachement actuel de cette préfecture.', sources: [update.sources.regions] }, `Signaler le rattachement non précisé : ${name}`);
  }
  for (const name of update.conakryCommunes) {
    const existing = find('communes', name);
    const fields = { region: conakry._id, administrativeStatus: 'active', administrativeType: 'urban-commune', parentStatus: 'verified', reviewedAt, sources: [update.sources.communes], notes: 'Commune recensée dans le document DGE relatif à la zone spéciale de Conakry en 2026. Quartiers et statistiques à compléter.' };
    if (!existing) fields.metricsStatus = 'unavailable';
    ensure('communes', name, fields);
  }
  return { operations, warnings, counts: Object.fromEntries(Object.entries(state).map(([key, docs]) => [key, docs.filter(doc => doc.administrativeStatus !== 'historical' && (key !== 'prefectures' || doc.administrativeType !== 'special-zone')).length])) };
}
module.exports = { buildPlan, normalize };
