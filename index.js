const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

const regionRoutes = require('./routes/regionRoutes'); // Assurez-vous que le chemin est correct
const communeRoutes = require('./routes/communeRoutes'); // Assurez-vous que le chemin est correct
const quartierRoutes = require('./routes/quartierRoutes'); // Assurez-vous que le chemin est correct
const prefectureRoutes = require('./routes/prefectureRoutes');
const sousPrefectureRoutes = require('./routes/sousPrefectureRoutes');


// Middleware pour parser le JSON
app.use(express.json());

// Connexion à MongoDB
mongoose.connect('mongodb+srv://xenlior:xenlior@cluster0.aowfv.mongodb.net/api-guinea-geo')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Définition d'une route de test
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(regionRoutes);
app.use(communeRoutes);
app.use(quartierRoutes);
app.use(prefectureRoutes);
app.use(sousPrefectureRoutes);

// Vérifie si l'application s'exécute localement
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`L'application est démarrée sur http://localhost:${port}`);
  });
}

// Exportation pour Vercel
module.exports = app;