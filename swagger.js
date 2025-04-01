const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const swaggerDocument = JSON.parse(fs.readFileSync('./swagger.json'));

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
