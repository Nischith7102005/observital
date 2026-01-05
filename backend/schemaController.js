const transformationEngine = require('./transformationEngine');

const schemaController = {
  // Get all schemas
  getAllSchemas: (req, res) => {
    res.json({
      success: true,
      count: global.schemas.length,
      schemas: global.schemas
    });
  },

  // Create a new schema
  createSchema: (req, res) => {
    const { name, version, type, tables } = req.body;

    if (!name || !version || !type || !tables) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, version, type, tables'
      });
    }

    const schema = {
      id: Date.now().toString(),
      name,
      version,
      type,
      tables,
      createdAt: new Date().toISOString()
    };

    global.schemas.push(schema);

    res.status(201).json({
      success: true,
      message: 'Schema created successfully',
      schema
    });
  },

  // Get schema by ID
  getSchema: (req, res) => {
    const schema = global.schemas.find(s => s.id === req.params.id);

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      });
    }

    res.json({
      success: true,
      schema
    });
  },

  // Delete schema
  deleteSchema: (req, res) => {
    const index = global.schemas.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      });
    }

    const deleted = global.schemas.splice(index, 1);

    res.json({
      success: true,
      message: 'Schema deleted successfully',
      schema: deleted[0]
    });
  },

  // Transform schema
  transformSchema: (req, res) => {
    const { schemaId, targetType, targetVersion } = req.body;

    if (!schemaId || !targetType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: schemaId, targetType'
      });
    }

    const schema = global.schemas.find(s => s.id === schemaId);

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      });
    }

    const transformed = transformationEngine.transform(schema, targetType, targetVersion);

    const transformation = {
      id: Date.now().toString(),
      sourceSchema: schema,
      targetType,
      targetVersion: targetVersion || '1.0',
      result: transformed,
      timestamp: new Date().toISOString()
    };

    global.transformations.push(transformation);

    res.json({
      success: true,
      message: 'Schema transformed successfully',
      transformation
    });
  },

  // Get transformation history
  getTransformations: (req, res) => {
    res.json({
      success: true,
      count: global.transformations.length,
      transformations: global.transformations
    });
  },

  // Merge multiple schemas
  mergeSchemas: (req, res) => {
    const { schemaIds, mergedName } = req.body;

    if (!schemaIds || !Array.isArray(schemaIds) || schemaIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 schema IDs required for merging'
      });
    }

    const schemasToMerge = schemaIds.map(id => 
      global.schemas.find(s => s.id === id)
    ).filter(Boolean);

    if (schemasToMerge.length !== schemaIds.length) {
      return res.status(404).json({
        success: false,
        error: 'One or more schemas not found'
      });
    }

    const merged = transformationEngine.mergeSchemas(schemasToMerge, mergedName);

    global.schemas.push(merged);

    res.json({
      success: true,
      message: 'Schemas merged successfully',
      mergedSchema: merged
    });
  },

  // Check compatibility between schemas
  checkCompatibility: (req, res) => {
    const { sourceSchemaId, targetSchemaId } = req.body;

    if (!sourceSchemaId || !targetSchemaId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceSchemaId, targetSchemaId'
      });
    }

    const sourceSchema = global.schemas.find(s => s.id === sourceSchemaId);
    const targetSchema = global.schemas.find(s => s.id === targetSchemaId);

    if (!sourceSchema || !targetSchema) {
      return res.status(404).json({
        success: false,
        error: 'One or both schemas not found'
      });
    }

    const compatibility = transformationEngine.checkCompatibility(sourceSchema, targetSchema);

    res.json({
      success: true,
      compatibility
    });
  }
};

module.exports = schemaController;