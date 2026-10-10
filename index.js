require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./utils/database');

async function start() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('PORT doit être un entier entre 1 et 65535');
    error.code = 'INVALID_PORT';
    throw error;
  }
  await connectDatabase();
  console.log('Connexion à MongoDB réussie !');
  const server = app.listen(port, () => {
    console.log(`L'application est démarrée sur http://localhost:${port}`);
  });
  server.on('error', (error) => {
    console.error(`Démarrage impossible : ${error.code || error.name}`);
    require('mongoose').disconnect().finally(() => { process.exitCode = 1; });
  });
  return server;
}

if (!process.env.VERCEL && require.main === module) {
  start().catch((error) => {
    // Les erreurs de connexion peuvent contenir des identifiants dans leur message.
    console.error(`Démarrage impossible : ${error.code || error.name}. Vérifiez MONGO_URI, l'accès à MongoDB et PORT.`);
    process.exitCode = 1;
  });
}

// En serverless, ouvrir la connexion avant de transmettre la requête à Express.
module.exports = process.env.VERCEL ? async (req, res) => {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error(`Connexion MongoDB impossible : ${error.code || error.name}`);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Base de données indisponible', code: 503 }));
  }
} : app;
module.exports.start = start;
