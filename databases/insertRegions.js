const mongoose = require('mongoose');
const Region = require('../models/regionModel'); // Assurez-vous que le chemin d'accès est correct

mongoose.connect('mongodb+srv://xenlior:xenlior@cluster0.aowfv.mongodb.net/api-guinea-geo')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const regions = [
  {
    name: "Boké",
    zone: "Ouest",
    population: 1081445,
    area: 31186
  },
  {
    name: "Conakry",
    zone: "Ouest",
    population: 1667864,
    area: 450
  },
  {
    name: "Faranah",
    zone: "Est",
    population: 942733,
    area: 35581
  },
  {
    name: "Kankan",
    zone: "Est",
    population: 1986329,
    area: 72145
  },
  {
    name: "Kindia",
    zone: "Ouest",
    population: 1559185,
    area: 28873
  },
  {
    name: "Labé",
    zone: "Centrale",
    population: 995717,
    area: 22869
  },
  {
    name: "Mamou",
    zone: "Centrale",
    population: 732117,
    area: 17074
  },
  {
    name: "Nzérékoré",
    zone: "Est",
    population: 1663582,
    area: 37658
  }
];


Region.deleteMany({})
  .then(() => {
    console.log('Toutes les régions précédentes ont été supprimées.');
    Region.insertMany(regions)
      .then(() => {
        console.log('Régions insérées avec succès !');
        mongoose.connection.close();
      })
      .catch((err) => {
        console.error('Erreur lors de l\'insertion des régions :', err);
        mongoose.connection.close();
      });
  })
  .catch((err) => {
    console.error('Erreur lors de la suppression des régions :', err);
    mongoose.connection.close();
  });