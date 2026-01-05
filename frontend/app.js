const API_URL = 'http://localhost:3000/api';

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Load data if needed
        if (tabName === 'view') {
            loadSchemas();
        } else if (tabName === 'transform' || tabName === 'compatibility') {
            loadSchemaOptions();
        } else if (tabName === 'merge') {
            loadMergeOptions();
        }
    });
});

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Add table to schema creation form
document.getElementById('add-table').addEventListener('click', () => {
    const tablesContainer = document.getElementById('tables-container');
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table-definition';
    tableDiv.innerHTML = `
        <input type="text" class="table-name" placeholder="Table name" required>
        <div class="columns-container">
            <div class="column-row">
                <input type="text" class="column-name" placeholder="Column name">
                <input type="text" class="column-type" placeholder="Type">
                <label><input type="checkbox" class="column-nullable"> Nullable</label>
            </div>
        </div>
        <button type="button" class="btn-secondary add-column">+ Add Column</button>
    `;
    tablesContainer.appendChild(tableDiv);
    
    // Add event listener to new "Add Column" button
    tableDiv.querySelector('.add-column').addEventListener('click', function() {
        addColumnRow(this);
    });
});

// Add column row
function addColumnRow(button) {
    const columnsContainer = button.previousElementSibling;
    const columnRow = document.createElement('div');
    columnRow.className = 'column-row';
    columnRow.innerHTML = `
        <input type="text" class="column-name" placeholder="Column name">
        <input type="text" class="column-type" placeholder="Type">
        <label><input type="checkbox" class="column-nullable"> Nullable</label>
    `;
    columnsContainer.appendChild(columnRow);
}

// Add event listeners to initial "Add Column" buttons
document.querySelectorAll('.add-column').forEach(button => {
    button.addEventListener('click', function() {
        addColumnRow(this);
    });
});

// Create schema form submission
document.getElementById('create-schema-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('schema-name').value;
    const version = document.getElementById('schema-version').value;
    const type = document.getElementById('schema-type').value;
    
    // Parse tables
    const tables = [];
    document.querySelectorAll('.table-definition').forEach(tableDiv => {
        const tableName = tableDiv.querySelector('.table-name').value;
        if (!tableName) return;
        
        const columns = [];
        tableDiv.querySelectorAll('.column-row').forEach(row => {
            const colName = row.querySelector('.column-name').value;
            const colType = row.querySelector('.column-type').value;
            const nullable = row.querySelector('.column-nullable').checked;
            
            if (colName && colType) {
                columns.push({
                    name: colName,
                    type: colType,
                    nullable: nullable
                });
            }
        });
        
        if (columns.length > 0) {
            tables.push({
                name: tableName,
                columns: columns
            });
        }
    });
    
    if (tables.length === 0) {
        showNotification('Please add at least one table with columns', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/schemas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, version, type, tables })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Schema created successfully in Observital!');
            e.target.reset();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error creating schema', 'error');
        console.error(error);
    }
});

// Transform schema form submission
document.getElementById('transform-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const schemaId = document.getElementById('transform-schema-id').value;
    const targetType = document.getElementById('target-type').value;
    const targetVersion = document.getElementById('target-version').value || '1.0';
    
    try {
        const response = await fetch(`${API_URL}/transform`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schemaId, targetType, targetVersion })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Schema transformed successfully by Observital!');
            displayTransformationResult(data.transformation);
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error transforming schema', 'error');
        console.error(error);
    }
});

// Display transformation result
function displayTransformationResult(transformation) {
    const resultDiv = document.getElementById('transformation-result');
    resultDiv.innerHTML = `
        <h3>🔭 Transformation Result</h3>
        <p><strong>Source:</strong> ${transformation.sourceSchema.name} (${transformation.sourceSchema.type})</p>
        <p><strong>Target:</strong> ${transformation.result.name} (${transformation.targetType})</p>
        <p><strong>Version:</strong> ${transformation.targetVersion}</p>
        <h4>Transformed Schema:</h4>
        <pre>${JSON.stringify(transformation.result, null, 2)}</pre>
    `;
}

// Merge schemas form submission
document.getElementById('merge-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const checkboxes = document.querySelectorAll('#merge-schema-list input[type="checkbox"]:checked');
    const schemaIds = Array.from(checkboxes).map(cb => cb.value);
    const mergedName = document.getElementById('merged-name').value;
    
    if (schemaIds.length < 2) {
        showNotification('Please select at least 2 schemas to merge', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schemaIds, mergedName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Schemas merged successfully by Observital!');
            displayMergeResult(data.mergedSchema);
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error merging schemas', 'error');
        console.error(error);
    }
});

// Display merge result
function displayMergeResult(mergedSchema) {
    const resultDiv = document.getElementById('merge-result');
    resultDiv.innerHTML = `
        <h3>🔭 Merged Schema: ${mergedSchema.name}</h3>
        <p><strong>Type:</strong> ${mergedSchema.type}</p>
        <p><strong>Total Tables:</strong> ${mergedSchema.tables.length}</p>
        <h4>Schema Details:</h4>
        <pre>${JSON.stringify(mergedSchema, null, 2)}</pre>
    `;
}

// Compatibility check form submission
document.getElementById('compatibility-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sourceSchemaId = document.getElementById('source-schema-id').value;
    const targetSchemaId = document.getElementById('target-schema-id').value;
    
    if (sourceSchemaId === targetSchemaId) {
        showNotification('Please select different schemas', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/compatibility-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceSchemaId, targetSchemaId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCompatibilityResult(data.compatibility);
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error checking compatibility', 'error');
        console.error(error);
    }
});

// Display compatibility result
function displayCompatibilityResult(compatibility) {
    const resultDiv = document.getElementById('compatibility-result');
    
    const statusColor = compatibility.isCompatible ? '#28a745' : '#dc3545';
    
    let issuesHTML = '';
    if (compatibility.issues.length > 0) {
        issuesHTML = `
            <h4>Issues Found:</h4>
            <div class="issues-list">
                ${compatibility.issues.map(issue => `
                    <div class="issue-item ${issue.severity}">
                        <strong>${issue.severity.toUpperCase()}:</strong> ${issue.message}
                        ${issue.table ? `<br><small>Table: ${issue.table}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    resultDiv.innerHTML = `
        <h3>🔭 Observital Compatibility Analysis</h3>
        <div class="compatibility-score" style="color: ${statusColor}">
            ${compatibility.compatibilityScore}%
        </div>
        <p style="text-align: center; font-size: 1.2em;">
            <strong>Status:</strong> ${compatibility.isCompatible ? '✅ Compatible' : '⚠️ Issues Found'}
        </p>
        <div style="margin: 20px 0;">
            <p><strong>Total Issues:</strong> ${compatibility.summary.totalIssues}</p>
            <p><strong>Errors:</strong> ${compatibility.summary.errors}</p>
            <p><strong>Warnings:</strong> ${compatibility.summary.warnings}</p>
            <p><strong>Compatible Items:</strong> ${compatibility.summary.compatibleItems}</p>
        </div>
        ${issuesHTML}
    `;
}

// Load schemas for viewing
async function loadSchemas() {
    try {
        const response = await fetch(`${API_URL}/schemas`);
        const data = await response.json();
        
        const schemasList = document.getElementById('schemas-list');
        
        if (data.schemas.length === 0) {
            schemasList.innerHTML = '<p style="text-align: center; color: #6c757d;">No schemas created yet. Start by creating your first schema!</p>';
            return;
        }
        
        schemasList.innerHTML = data.schemas.map(schema => `
            <div class="schema-card">
                <h3>🔭 ${schema.name}</h3>
                <div class="schema-info">
                    <p><strong>Type:</strong> ${schema.type}</p>
                    <p><strong>Version:</strong> ${schema.version}</p>
                    <p><strong>Created:</strong> ${new Date(schema.createdAt).toLocaleString()}</p>
                    <p><strong>Tables:</strong> ${schema.tables.length}</p>
                </div>
                <div class="schema-tables">
                    ${schema.tables.map(table => `
                        <div class="table-item">
                            <strong>${table.name}</strong> (${table.columns.length} columns)
                        </div>
                    `).join('')}
                </div>
                <button class="delete-btn" onclick="deleteSchema('${schema.id}')">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        showNotification('Error loading schemas', 'error');
        console.error(error);
    }
}

// Load schema options for transform and compatibility
async function loadSchemaOptions() {
    try {
        const response = await fetch(`${API_URL}/schemas`);
        const data = await response.json();
        
        const transformSelect = document.getElementById('transform-schema-id');
        const sourceSelect = document.getElementById('source-schema-id');
        const targetSelect = document.getElementById('target-schema-id');
        
        const options = data.schemas.map(schema => 
            `<option value="${schema.id}">${schema.name} (${schema.type})</option>`
        ).join('');
        
        if (transformSelect) transformSelect.innerHTML = '<option value="">Select a schema</option>' + options;
        if (sourceSelect) sourceSelect.innerHTML = '<option value="">Select schema</option>' + options;
        if (targetSelect) targetSelect.innerHTML = '<option value="">Select schema</option>' + options;
    } catch (error) {
        console.error('Error loading schema options:', error);
    }
}

// Load merge options
async function loadMergeOptions() {
    try {
        const response = await fetch(`${API_URL}/schemas`);
        const data = await response.json();
        
        const mergeList = document.getElementById('merge-schema-list');
        
        if (data.schemas.length === 0) {
            mergeList.innerHTML = '<p>No schemas available. Create some schemas first.</p>';
            return;
        }
        
        mergeList.innerHTML = '<div class="checkbox-group">' + data.schemas.map(schema => `
            <label>
                <input type="checkbox" value="${schema.id}">
                🔭 ${schema.name} (${schema.type}) - ${schema.tables.length} tables
            </label>
        `).join('') + '</div>';
    } catch (error) {
        console.error('Error loading merge options:', error);
    }
}

// Delete schema
async function deleteSchema(id) {
    if (!confirm('Are you sure you want to delete this schema?')) return;
    
    try {
        const response = await fetch(`${API_URL}/schemas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Schema deleted successfully!');
            loadSchemas();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error deleting schema', 'error');
        console.error(error);
    }
}

// Refresh schemas button
document.getElementById('refresh-schemas').addEventListener('click', loadSchemas);

// Load schemas on page load
loadSchemas();