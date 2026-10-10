const { test } = require('node:test');
const assert = require('node:assert/strict');
const { serializeRecord } = require('../utils/populationResponse');
const census = require('../data/populations-rgph4-2025.json');
const known = () => ({ ...census.regions.find(row => row.name === 'Conakry'), referenceId: census.id, year: 2025, publicationStatus: 'preliminary', source: census.source, geographicReference: census.geographicReference, boundaryCompatibility: 'not-assessed' });
const future = (year, population, status = 'final') => ({ referenceId: `verified-${year}`, year, population, publicationStatus: status, verificationStatus: 'verified', geographicReference: 'Périmètre validé', boundaryCompatibility: 'verified', source: { title: 'Publication vérifiée', url: 'https://www.stat-guinee.org/data.pdf', publishedAt: `${year}-08-01` } });
test('réponse : dernier chiffre INS à la place du scalaire hérité, année et provenance explicites', () => {
  const source = { name: 'Conakry', population: 1667864, populationObservations: [known()] };
  const response = serializeRecord(source, { kind: 'regions' });
  assert.equal(response.population, 3407327); assert.equal(response.populationReferenceYear, 2025);
  assert.equal(response.populationStatus, 'preliminary'); assert.equal(response.populationSource.printedPage, 26);
  assert.equal(response.populationObservations, undefined); assert.equal(response.populationHistory, undefined);
  assert.equal(source.population, 1667864);
});
test('sans observation vérifiée : population null même si le vieux scalaire est étiqueté verified', () => {
  const response = serializeRecord({ name: 'Test', population: 42, metricsStatus: 'verified', populationReferenceYear: 2014 }, { kind: 'regions' });
  assert.equal(response.population, null); assert.equal(response.populationReferenceYear, null);
});
test('sélection : ignorer une observation récente non vérifiée et préférer la plus récente vérifiée', () => {
  const record = { name: 'Test', populationObservations: [future(2024, 10), { ...future(2026, 999), verificationStatus: 'unverified' }, future(2025, 20)] };
  assert.equal(serializeRecord(record, { kind: 'regions' }).population, 20);
});
test('même année : résultats définitifs prioritaires sur préliminaires', () => {
  const record = { name: 'Test', populationObservations: [future(2025, 10, 'preliminary'), future(2025, 20, 'final')] };
  assert.equal(serializeRecord(record, { kind: 'regions' }).population, 20);
});
test('identité et périmètre : une population de préfecture ne devient pas celle de la nouvelle région', () => {
  const row = census.prefectures.find(value => value.name === 'Siguiri');
  const record = { name: 'Siguiri', effectiveFrom: '2026-08-20', populationObservations: [{ ...known(), ...row }] };
  assert.equal(serializeRecord(record, { kind: 'regions' }).population, null);
  assert.equal(serializeRecord({ name: 'Conakry', effectiveFrom: '2025-08-20', populationObservations: [known()] }, { kind: 'regions' }).population, null);
});
test('référentiel connu : rejeter valeur, niveau ou empreinte de source contradictoires', () => {
  for (const observation of [{ ...known(), population: 1 }, { ...known(), source: { ...census.source, sha256: 'incorrect' } }]) {
    assert.equal(serializeRecord({ name: 'Conakry', populationObservations: [observation] }, { kind: 'regions' }).population, null);
  }
  assert.equal(serializeRecord({ name: 'Conakry', populationObservations: [known()] }, { kind: 'communes' }).population, null);
});
test('valeurs invalides, futures et sources non HTTP exclues', () => {
  for (const observation of [{ ...future(2025, 1), population: -1 }, future(2100, 1), { ...future(2025, 1), source: { url: 'javascript:alert(1)' } }]) {
    assert.equal(serializeRecord({ name: 'Test', populationObservations: [observation] }).population, null);
  }
});
test('historique demandé : anciennes valeurs accessibles sous populationHistory sans modifier la valeur principale', () => {
  const response = serializeRecord({ name: 'Conakry', population: 1667864, metricsStatus: 'legacy-unverified', populationObservations: [known()] }, { kind: 'regions', includeHistory: true });
  assert.equal(response.population, 3407327); assert.equal(response.populationHistory.legacy.population, 1667864);
  assert.equal(response.populationHistory.observations.length, 1);
});
