const mongoose = require('mongoose');
const Prefecture = require('../models/prefectureModel'); // Assurez-vous que le chemin d'accès est correct
const Region = require('../models/regionModel');


mongoose.connect('mongodb+srv://xenlior:xenlior@cluster0.aowfv.mongodb.net/api-guinea-geo')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Liste des préfectures avec le nom de leur région pour la correspondance
const prefecturesData = [
  { name: 'Boké', population: 449405, area: 11124, regionName: 'Boké' },
  { name: 'Boffa', population:212583, area:5050, regionName: 'Boké' },
  { name: 'Fria', population: 96527, area:2016, regionName: 'Boké' },
  { name: 'Gaoual', population:194245, area:7758, regionName: 'Boké' },
  { name: 'Koundara',population: 27433, area:5238, regionName: 'Boké' },

  { name: 'Conakry', regionName: 'Conakry' },

  {
    name: "Kindia",
    population: 196658, // Population de la ville de Kindia (2014)
    area: 28873, // Superficie de la préfecture de Kindia
    regionName: "Kindia",
  },
  {
    name: "Coyah",
    population: 266000, // Estimation de la population (2016)
    area: 12584, // Superficie de la préfecture de Coyah
    regionName: "Kindia",
  },
  {
    name: "Dubréka",
    population: 346102, // Population de la préfecture de Dubréka (2014)
    area: 4376, // Superficie de la préfecture de Dubréka
    regionName: "Kindia",
  },
  {
    name: "Forécariah",
    population: 205454, // Population de la préfecture de Forécariah (2014)
    area: 4300, // Superficie de la préfecture de Forécariah
    regionName: "Kindia",
  },
  {
    name: "Télimélé",
    population: 312458, // Population de la préfecture de Télimélé (2014)
    area: 8374, // Superficie de la préfecture de Télimélé
    regionName: "Kindia",
  },
  {
    name: "Labé",
    population: 436836,
    area: 4440,
    regionName: "Labé",
  },
  {
    name: "Koubia",
    population: 244234,
    area: 3580,
    regionName: "Labé",
  },
  {
    name: "Mali",
    population: 297339,
    area: 1410,
    regionName: "Labé",
  },
  {
    name: "Tougué",
    population: 251168,
    area: 4370,
    regionName: "Labé",
  },
  {
    name: "Lélouma",
    population: 181458,
    area: 4440,
    regionName: "Labé",
  },

  {
    name: "Faranah",
    population: 327705,
    area: 12636,
    regionName: "Faranah",
  },
  {
    name: "Dabola",
    population: 200329,
    area: 4063,
    regionName: "Faranah",
  },
  {
    name: "Dinguiraye",
    population: 276007,
    area: 4446,
    regionName: "Faranah",
  },
  {
    name: "Kissidougou",
    population: 240447,
    area: 8553,
    regionName: "Faranah",
  },

  {
    name: "Kankan",
    population: 514273,
    area: 19743,
    regionName: "Kankan",
  },
  {
    name: "Kouroussa",
    population: 276461,
    area: 10872,
    regionName: "Kankan",
  },
  {
    name: "Mandiana",
    population: 324461,
    area: 3887,
    regionName: "Kankan",
  },
  {
    name: "Kérouané",
    population: 378483,
    area: 7295,
    regionName: "Kankan",
  },
  {
    name: "Siguiri",
    population: 447604,
    area: 11114,
    regionName: "Kankan",
  },

  {
    name: "Mamou",
    population: 323354,
    area: 10642,
    regionName: "Mamou",
  },
  {
    name: "Dalaba",
    population: 156822,
    area: 4400,
    regionName: "Mamou",
  },
  {
    name: "Pita",
    population: 278576,
    area: 4400,
    regionName: "Mamou",
  },
  {
    name: "Nzérékoré",
    population: 384104,
    area: 34720,
    regionName: "Nzérékoré",
  },
  {
    name: "Beyla",
    population: 276461,
    area: 10872,
    regionName: "Nzérékoré",
  },
  {
    name: "Guéckédou",
    population: 324461,
    area: 3887,
    regionName: "Nzérékoré",
  },
  {
    name: "Macenta",
    population: 378483,
    area: 7295,
    regionName: "Nzérékoré",
  },
  {
    name: "Yomou",
    population: 447604,
    area: 11114,
    regionName: "Nzérékoré",
  },
  {
    name: "Lola",
    population: 188743,
    area: 4840,
    regionName: "Nzérékoré",
  },
];

async function clearPrefectureData() {
  try {
    await Prefecture.deleteMany({});
    console.log('Données de Prefecture supprimées');
    // Insertion de données ou autres opérations ici
  } catch (error) {
    console.error('Erreur lors de la suppression des données de Prefecture:', error);
  }
}


async function insertPrefectures() {
  for (const { name,  population, area, regionName } of prefecturesData) {
    const region = await Region.findOne({ name: regionName });
    if (!region) {
      console.log(`Région non trouvée: ${regionName}`);
      continue;
    }

    const prefecture = new Prefecture({
      name,
      population,
      area,
      region: region._id, // Assigne l'ID de la région correspondante
    });

    try {
      await prefecture.save();
      console.log(`Préfecture insérée: ${name}`);
    } catch (error) {
      console.error(`Erreur lors de l'insertion de la préfecture ${name}:`, error);
    }
  }

  mongoose.connection.close();
}


clearPrefectureData();
insertPrefectures();