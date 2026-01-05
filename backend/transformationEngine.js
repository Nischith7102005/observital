const transformationEngine = {
  // Transform schema to different database type
  transform: (schema, targetType, targetVersion = '1.0') => {
    const transformed = {
      id: Date.now().toString(),
      name: `${schema.name}_${targetType}`,
      version: targetVersion,
      type: targetType,
      sourceType: schema.type,
      tables: [],
      createdAt: new Date().toISOString()
    };

    // Transform each table
    schema.tables.forEach(table => {
      const transformedTable = {
        name: table.name,
        columns: table.columns.map(col => 
          transformationEngine.transformDataType(col, schema.type, targetType)
        )
      };

      // Add database-specific features
      if (targetType === 'PostgreSQL') {
        transformedTable.constraints = transformationEngine.addPostgreSQLConstraints(table);
      } else if (targetType === 'MongoDB') {
        transformedTable.indexes = transformationEngine.addMongoDBIndexes(table);
      } else if (targetType === 'MySQL') {
        transformedTable.engine = 'InnoDB';
      }

      transformed.tables.push(transformedTable);
    });

    return transformed;
  },

  // Transform data types between database systems
  transformDataType: (column, sourceType, targetType) => {
    const typeMapping = {
      'MySQL_to_PostgreSQL': {
        'INT': 'INTEGER',
        'VARCHAR': 'VARCHAR',
        'TEXT': 'TEXT',
        'DATETIME': 'TIMESTAMP',
        'TINYINT': 'SMALLINT'
      },
      'PostgreSQL_to_MySQL': {
        'INTEGER': 'INT',
        'VARCHAR': 'VARCHAR',
        'TEXT': 'TEXT',
        'TIMESTAMP': 'DATETIME',
        'SMALLINT': 'TINYINT'
      },
      'MySQL_to_MongoDB': {
        'INT': 'Number',
        'VARCHAR': 'String',
        'TEXT': 'String',
        'DATETIME': 'Date',
        'TINYINT': 'Number'
      },
      'PostgreSQL_to_MongoDB': {
        'INTEGER': 'Number',
        'VARCHAR': 'String',
        'TEXT': 'String',
        'TIMESTAMP': 'Date',
        'SMALLINT': 'Number'
      }
    };

    const mappingKey = `${sourceType}_to_${targetType}`;
    const mapping = typeMapping[mappingKey] || {};

    return {
      name: column.name,
      type: mapping[column.type] || column.type,
      originalType: column.type,
      nullable: column.nullable !== undefined ? column.nullable : true,
      default: column.default
    };
  },

  // Add PostgreSQL-specific constraints
  addPostgreSQLConstraints: (table) => {
    const constraints = [];
    
    table.columns.forEach(col => {
      if (col.name.toLowerCase().includes('id')) {
        constraints.push({
          type: 'PRIMARY KEY',
          column: col.name
        });
      }
      if (!col.nullable) {
        constraints.push({
          type: 'NOT NULL',
          column: col.name
        });
      }
    });

    return constraints;
  },

  // Add MongoDB-specific indexes
  addMongoDBIndexes: (table) => {
    const indexes = [];
    
    table.columns.forEach(col => {
      if (col.name.toLowerCase().includes('id') || col.name.toLowerCase().includes('email')) {
        indexes.push({
          field: col.name,
          unique: true
        });
      }
    });

    return indexes;
  },

  // Merge multiple schemas into one
  mergeSchemas: (schemas, mergedName) => {
    const mergedTables = [];
    const tableMap = new Map();

    // Combine all tables
    schemas.forEach(schema => {
      schema.tables.forEach(table => {
        if (tableMap.has(table.name)) {
          // Merge columns if table exists
          const existing = tableMap.get(table.name);
          const newColumns = table.columns.filter(
            col => !existing.columns.find(ec => ec.name === col.name)
          );
          existing.columns.push(...newColumns);
        } else {
          tableMap.set(table.name, { ...table });
        }
      });
    });

    tableMap.forEach(table => mergedTables.push(table));

    return {
      id: Date.now().toString(),
      name: mergedName || 'MergedSchema',
      version: '1.0',
      type: 'Unified',
      tables: mergedTables,
      sourceSchemas: schemas.map(s => s.id),
      createdAt: new Date().toISOString()
    };
  },

  // Check compatibility between two schemas
  checkCompatibility: (sourceSchema, targetSchema) => {
    const issues = [];
    const compatible = [];

    sourceSchema.tables.forEach(sourceTable => {
      const targetTable = targetSchema.tables.find(t => t.name === sourceTable.name);

      if (!targetTable) {
        issues.push({
          severity: 'warning',
          message: `Table "${sourceTable.name}" exists in source but not in target`
        });
        return;
      }

      // Check columns
      sourceTable.columns.forEach(sourceCol => {
        const targetCol = targetTable.columns.find(c => c.name === sourceCol.name);

        if (!targetCol) {
          issues.push({
            severity: 'warning',
            table: sourceTable.name,
            message: `Column "${sourceCol.name}" exists in source but not in target`
          });
        } else if (sourceCol.type !== targetCol.type) {
          issues.push({
            severity: 'info',
            table: sourceTable.name,
            column: sourceCol.name,
            message: `Type mismatch: ${sourceCol.type} vs ${targetCol.type}`
          });
        } else {
          compatible.push({
            table: sourceTable.name,
            column: sourceCol.name,
            message: 'Compatible'
          });
        }
      });
    });

    return {
      isCompatible: issues.filter(i => i.severity === 'error').length === 0,
      compatibilityScore: Math.round((compatible.length / (compatible.length + issues.length)) * 100),
      issues,
      compatible,
      summary: {
        totalIssues: issues.length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        compatibleItems: compatible.length
      }
    };
  }
};

module.exports = transformationEngine;