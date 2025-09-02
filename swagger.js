// swagger.js
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

function loadYaml(filePath) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return YAML.parse(raw);
}

// Par défaut, on lit ./swagger.yaml à la racine du projet
const swaggerDocument = loadYaml(path.join(__dirname, 'swagger.yaml'));

module.exports = { swaggerUi, swaggerDocument };
