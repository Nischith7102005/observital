const express = require('express');
const cors = require('cors');
const schemaController = require('./schemaController');
const transformationEngine = require('./transformationEngine');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store schemas in memory (in production, use a database)
global.schemas = [];
global.transformations = [];

// Routes
app.get('/api/schemas', schemaController.getAllSchemas);
app.post('/api/schemas', schemaController.createSchema);
app.get('/api/schemas/:id', schemaController.getSchema);
app.delete('/api/schemas/:id', schemaController.deleteSchema);

app.post('/api/transform', schemaController.transformSchema);
app.get('/api/transformations', schemaController.getTransformations);

app.post('/api/merge', schemaController.mergeSchemas);
app.post('/api/compatibility-check', schemaController.checkCompatibility);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Observital is running', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`🚀 Observital server running on http://localhost:${PORT}`);
});