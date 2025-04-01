const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8')
);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
