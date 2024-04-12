const mongoose = require('mongoose');
const Commune = require('../models/CommuneModel'); // Assurez-vous que le chemin d'accès est correct
const Region = require('../models/regionModel');


mongoose.connect('mongodb+srv://xenlior:xenlior@cluster0.aowfv.mongodb.net/api-guinea-geo')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const communesData = [
  { name: "Dixinn", region: "Conakry" },
  { name: "Kaloum", region: "Conakry" },
  { name: "Matam", region: "Conakry" },
  { name: "Matoto", region: "Conakry" },
  { name: "Ratoma", region: "Conakry" }
];


async function clearCommuneData() {
  try {
    await Commune.deleteMany({});
    console.log('Données de Commune supprimées');
  } catch (error) {
    console.error('Erreur lors de la suppression des données de Commune:', error);
  }
}

async function insertCommunes() {
  try {
    for (let data of communesData) {
      const region = await Region.findOne({ name: data.region }); // Trouver la préfecture par nom
      if (region) {
        let newCommune = new Commune({ ...data, region: region._id });
        await newCommune.save();
      } else {
        console.log(`Préfecture ${data.region} non trouvée`);
      }
    }
    console.log('Communes insérées avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des communes :', error);
  } finally {
    mongoose.connection.close();
  }
}

clearCommuneData();
insertCommunes();