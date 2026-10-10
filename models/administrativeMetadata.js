// Les chiffres hérités ne sont pas assimilés aux résultats du RGPH-4.
module.exports = {
  administrativeStatus: { type: String, enum: ['active', 'historical'], default: 'active' },
  administrativeType: String,
  effectiveFrom: String,
  reviewedAt: String,
  parentStatus: { type: String, enum: ['verified', 'legacy-unverified', 'pending'] },
  metricsStatus: { type: String, enum: ['verified', 'legacy-unverified', 'unavailable'] },
  populationReferenceYear: Number,
  populationObservations: [{
    _id: false, referenceId: String, year: Number,
    verificationStatus: { type: String, enum: ['verified', 'unverified'] },
    publicationStatus: { type: String, enum: ['preliminary', 'final'] },
    population: { type: Number, min: 0 }, male: { type: Number, min: 0 }, female: { type: Number, min: 0 },
    geographicReference: String,
    boundaryCompatibility: { type: String, enum: ['not-assessed', 'verified'] },
    regionAtCensus: String, sourcePdfPage: Number, sourcePrintedPage: Number, reviewedAt: String,
    source: { publisher: String, title: String, publishedAt: String, url: String, sha256: String }
  }],
  areaReferenceYear: Number,
  notes: String,
  replacement: { type: { type: String }, name: String },
  sources: [{ _id: false, title: String, url: String, publishedAt: String }]
};
