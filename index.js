const express = require('express');
const path = require('path');
const errorHandler = require('./utils/errorHandler');
require('dotenv').config();
//const swaggerDocs = require('./swagger');


const mongoose = require('mongoose');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
//swaggerDocs(app);

const regionRoutes = require('./routes/regionRoutes'); // Assurez-vous que le chemin est correct
const communeRoutes = require('./routes/communeRoutes'); // Assurez-vous que le chemin est correct
const quartierRoutes = require('./routes/quartierRoutes'); // Assurez-vous que le chemin est correct
const prefectureRoutes = require('./routes/prefectureRoutes');
const sousPrefectureRoutes = require('./routes/sousPrefectureRoutes');


// Middleware pour parser le JSON
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

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