const express = require('express');
const path = require('path');
const errorHandler = require('./utils/errorHandler');
const swaggerDocs = require('./swagger');
const { populationOptionsMiddleware } = require('./utils/populationResponse');


const app = express();

app.use(express.static(path.join(__dirname, 'public')));
swaggerDocs(app);

app.get('/populations/rgph4-2025', (req, res) => res.json(require('./data/populations-rgph4-2025.json')));

app.get('/data-sources', (req, res) => res.json(require('./data/administrative-update-2026.json')));

const regionRoutes = require('./routes/regionRoutes'); // Assurez-vous que le chemin est correct
const communeRoutes = require('./routes/communeRoutes'); // Assurez-vous que le chemin est correct
const quartierRoutes = require('./routes/quartierRoutes'); // Assurez-vous que le chemin est correct
const prefectureRoutes = require('./routes/prefectureRoutes');
const sousPrefectureRoutes = require('./routes/sousPrefectureRoutes');


// Middleware pour parser le JSON
app.use(express.json());
app.use(populationOptionsMiddleware);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(regionRoutes);
app.use(communeRoutes);
app.use(quartierRoutes);
app.use(prefectureRoutes);
app.use(sousPrefectureRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route non trouvée', code: 404 }));
app.use(errorHandler);

module.exports = app;
