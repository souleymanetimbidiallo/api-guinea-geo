function escapeName(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateSearchName(req, res, next) {
  const { name } = req.query;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Veuillez fournir un nom avec ?name=...', code: 400 });
  }
  req.query.name = name.trim();
  next();
}

module.exports = { escapeName, validateSearchName };
