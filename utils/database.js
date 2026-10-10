const mongoose = require('mongoose');
let connection;

function connectDatabase() {
  if (!process.env.MONGO_URI) {
    const error = new Error('MONGO_URI est requise');
    error.code = 'MONGO_URI_MISSING';
    return Promise.reject(error);
  }
  if (!connection) {
    connection = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => { connection = undefined; throw error; });
  }
  return connection;
}

module.exports = { connectDatabase };
