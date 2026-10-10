module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = Number(err.status || err.statusCode) || 500;
  const code = status >= 400 && status <= 599 ? status : 500;
  console.error(`Erreur HTTP ${code} : ${err.code || err.name}`);
  res.status(code).json({
    message: code >= 500 ? 'Erreur serveur' : err.message || 'Requête invalide',
    code
  });
};
