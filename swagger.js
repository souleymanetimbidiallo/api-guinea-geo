const swaggerUi = require('swagger-ui-express');

// On importe directement le JSON comme un module
const swaggerDocument = require('./swagger.json'); // <== sans readFileSync

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
