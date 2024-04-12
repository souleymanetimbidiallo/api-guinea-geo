const mongoose = require('mongoose');
const Quartier = require('../models/quartierModel');
const Commune = require('../models/CommuneModel'); // Assurez-vous que le chemin d'accès est correct



mongoose.connect('mongodb+srv://xenlior:xenlior@cluster0.aowfv.mongodb.net/api-guinea-geo')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Exemple de données de quartiers - Remplacez <ID_de_la_commune> par les vrais ID
const quartiersData = [
  { name: "Almamya", commune: "Kaloum" },
  { name: "Camayenne", commune: "Dixinn" },
];

async function clearQuartierData() {
  try {
    await Quartier.deleteMany({});
    console.log('Données de Quartier supprimées');
    // Insertion de données ou autres opérations ici
  } catch (error) {
    console.error('Erreur lors de la suppression des données de Quartier:', error);
  }
}


async function insertQuartiers() {
  try {
    for (let data of quartiersData) {
      const commune = await Commune.findOne({ name: data.commune }); // Trouver la préfecture par nom
      if (commune) {
        let newQuartier = new Quartier({ ...data, commune: commune._id });
        await newQuartier.save();
      } else {
        console.log(`Commune ${data.commune} non trouvée`);
      }
    }
    console.log('Quartiers insérés avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des quartiers :', error);
  } finally {
    mongoose.connection.close();
  }
}

clearQuartierData();
insertQuartiers();