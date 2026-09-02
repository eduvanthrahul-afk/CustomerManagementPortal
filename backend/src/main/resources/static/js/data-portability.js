/**
 * Verdant CRM - Data Portability & Bulk Action Suite
 * Supports CSV Export, Smart Column Mapping Import Wizard, and Multi-Select Table Operations
 */

const DataPortability = {
  currentModule: 'leads', // 'leads', 'customers', 'payments'
  parsedData: [],
  headers: [],
  selectedIds: new Set(),

  // Module schemas for column auto-detection
  schemas: {
    leads: [
      { key: 'name', label: 'Lead Name / Contact', required: true, aliases: ['name', 'full name', 'contact', 'client name'] },
      { key: 'email', label: 'Email Address', required: false, aliases: ['email', 'email address', 'mail'] },
      { key: 'phone', label: 'Phone Number', required: false, aliases: ['phone', 'mobile', 'tel', 'phone number'] },
      { key: 'company', label: 'Company / Organization', required: false, aliases: ['company', 'organization', 'business', 'org'] },
      { key: 'source', label: 'Lead Source', required: false, aliases: ['source', 'channel', 'lead source'] },
      { key: 'location', label: 'Location / City', required: false, aliases: ['location', 'city', 'address'] },
      { key: 'estimatedValue', label: 'Estimated Value ($)', required: false, aliases: ['value', 'estimated value', 'deal size', 'budget', 'amount'] },
      { key: 'requirement', label: 'Requirements / Notes', required: false, aliases: ['requirement', 'notes', 'details', 'description'] }
    ],
    customers: [
      { key: 'name', label: 'Customer Name', required: true, aliases: ['name', 'client', 'customer name', 'account name'] },
      { key: 'company', label: 'Company', required: false, aliases: ['company', 'organization', 'business'] },
      { key: 'email', label: 'Email Address', required: true, aliases: ['email', 'email address', 'mail'] },
      { key: 'phone', label: 'Phone Number', required: false, aliases: ['phone', 'mobile', 'tel'] },
      { key: 'city', label: 'City', required: false, aliases: ['city', 'location'] },
      { key: 'address', label: 'Street Address', required: false, aliases: ['address', 'street'] },
      { key: 'notes', label: 'Notes', required: false, aliases: ['notes', 'comments'] }
    ],
    payments: [
      { key: 'customerId', label: 'Customer ID', required: true, aliases: ['customer id', 'client id', 'customer_id'] },
      { key: 'amount', label: 'Amount ($)', required: true, aliases: ['amount', 'invoice amount', 'total'] },
      { key: 'dueDate', label: 'Due Date (YYYY-MM-DD)', required: true, aliases: ['due date', 'due_date', 'due'] },
      { key: 'paymentMethod', label: 'Payment Method', required: false, aliases: ['method', 'payment method', 'type'] },
      { key: 'referenceNumber', label: 'Invoice / Ref #', required: false, aliases: ['ref', 'reference', 'invoice #', 'invoice number'] }
    ]
  },

  // ==========================================
  // 1. CSV EXPORT ENGINE
  // ==========================================
  exportToCSV(moduleType, records) {
    if (!records || records.length === 0) {
      Toast.warning('No records available to export.');
      return;
    }

    let csvContent = '';
    const schema = this.schemas[moduleType] || [];
    if (schema.length === 0 && records.length > 0) {
      const keys = Object.keys(records[0]).filter(k => typeof records[0][k] !== 'object');
      const headers = keys.map(k => `"${k.replace(/"/g, '""')}"`);
      csvContent += headers.join(',') + '\r\n';
      records.forEach(r => {
        const row = keys.map(k => {
          let val = r[k];
          if (val === null || val === undefined) val = '';
          return `"${val.toString().replace(/"/g, '""')}"`;
        });
        csvContent += row.join(',') + '\r\n';
      });
    } else {
      const headers = schema.map(s => `"${s.label.replace(/"/g, '""')}"`);
      csvContent += headers.join(',') + '\r\n';

      records.forEach(r => {
        const row = schema.map(s => {
          let val = r[s.key];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'number') val = val.toString();
          return `"${val.toString().replace(/"/g, '""')}"`;
        });
        csvContent += row.join(',') + '\r\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `verdant_${moduleType}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    let label = moduleType;
    if (moduleType === 'leads') label = records.length === 1 ? 'lead' : 'leads';
    else if (moduleType === 'customers') label = records.length === 1 ? 'customer' : 'customers';
    else if (moduleType === 'payments') label = records.length === 1 ? 'invoice' : 'invoices';

    Toast.success(`Successfully exported ${records.length} ${label} to CSV.`);
  },

  // ==========================================
  // 2. CSV IMPORT WIZARD & COLUMN MAPPER
  // ==========================================
  openImportModal(moduleType) {
    this.currentModule = moduleType;
    this.parsedData = [];
    this.headers = [];

    const titleEl = document.getElementById('modal-csv-import-title');
    if (titleEl) {
      titleEl.textContent = `Import ${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)} via CSV`;
    }

    const dropzone = document.getElementById('csv-dropzone');
    const mappingSection = document.getElementById('csv-mapping-section');
    const previewSection = document.getElementById('csv-preview-section');
    const btnSubmit = document.getElementById('btn-commit-csv-import');

    if (dropzone) dropzone.style.display = 'block';
    if (mappingSection) mappingSection.style.display = 'none';
    if (previewSection) previewSection.style.display = 'none';
    if (btnSubmit) btnSubmit.style.display = 'none';

    Modal.open('modal-csv-import');
  },

  handleFileSelect(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      Toast.error('Please upload a valid .csv file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.parseCSVText(text);
    };
    reader.readAsText(file);
  },

  parseCSVText(text) {
    const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      Toast.error('CSV file must contain at least a header and one data row.');
      return;
    }

    // Split CSV line respecting quoted commas
    const parseLine = (line) => {
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const row = [];
      let match;
      while ((match = regex.exec(line)) !== null && match.index < line.length) {
        let val = match[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        row.push(val.trim());
      }
      return row;
    };

    this.headers = parseLine(lines[0]);
    this.parsedData = lines.slice(1).map(l => parseLine(l)).filter(r => r.some(c => c !== ''));

    this.renderColumnMappingUI();
  },

  renderColumnMappingUI() {
    const dropzone = document.getElementById('csv-dropzone');
    const mappingSection = document.getElementById('csv-mapping-section');
    const previewSection = document.getElementById('csv-preview-section');
    const btnSubmit = document.getElementById('btn-commit-csv-import');
    const tableBody = document.getElementById('csv-mapping-table-body');

    if (dropzone) dropzone.style.display = 'none';
    if (mappingSection) mappingSection.style.display = 'block';
    if (previewSection) previewSection.style.display = 'block';
    if (btnSubmit) btnSubmit.style.display = 'inline-flex';

    const schema = this.schemas[this.currentModule] || [];

    tableBody.innerHTML = schema.map(field => {
      // Auto-detect matching header index
      let matchedIndex = -1;
      this.headers.forEach((h, idx) => {
        const cleanH = h.toLowerCase().trim();
        if (field.aliases.includes(cleanH) || cleanH.includes(field.key.toLowerCase())) {
          matchedIndex = idx;
        }
      });

      const options = [
        '<option value="-1">-- Ignore / Do Not Map --</option>',
        ...this.headers.map((h, idx) => `<option value="${idx}" ${idx === matchedIndex ? 'selected' : ''}>${h} (Column ${idx + 1})</option>`)
      ].join('');

      return `
        <tr>
          <td>
            <strong>${field.label}</strong>
            ${field.required ? '<span style="color: var(--danger);"> *</span>' : ''}
          </td>
          <td>
            <select class="form-select csv-field-mapper" data-field="${field.key}" onchange="DataPortability.updatePreviewTable()">
              ${options}
            </select>
          </td>
        </tr>
      `;
    }).join('');

    this.updatePreviewTable();
  },

  getMapping() {
    const mapping = {};
    document.querySelectorAll('.csv-field-mapper').forEach(sel => {
      const field = sel.getAttribute('data-field');
      const idx = parseInt(sel.value, 10);
      if (idx >= 0) {
        mapping[field] = idx;
      }
    });
    return mapping;
  },

  updatePreviewTable() {
    const mapping = this.getMapping();
    const thead = document.getElementById('csv-preview-thead');
    const tbody = document.getElementById('csv-preview-tbody');
    if (!thead || !tbody) return;

    const mappedFields = Object.keys(mapping);
    thead.innerHTML = `<tr>${mappedFields.map(f => `<th>${f}</th>`).join('')}</tr>`;

    const sampleRows = this.parsedData.slice(0, 5);
    tbody.innerHTML = sampleRows.map(row => {
      const cells = mappedFields.map(f => {
        const colIdx = mapping[f];
        return `<td>${row[colIdx] || '<span style="color:var(--muted);">-</span>'}</td>`;
      });
      return `<tr>${cells.join('')}</tr>`;
    }).join('');

    const countEl = document.getElementById('csv-parsed-rows-count');
    if (countEl) {
      countEl.textContent = `${this.parsedData.length} total rows parsed (${sampleRows.length} shown in preview)`;
    }
  },

  async commitImport() {
    const mapping = this.getMapping();
    const schema = this.schemas[this.currentModule] || [];

    // Verify required fields
    for (const s of schema) {
      if (s.required && mapping[s.key] === undefined) {
        Toast.error(`Field "${s.label}" is required. Please map it to a CSV column.`);
        return;
      }
    }

    // Build payload records
    const payload = this.parsedData.map(row => {
      const record = {};
      Object.entries(mapping).forEach(([field, colIdx]) => {
        let val = row[colIdx];
        if (field === 'estimatedValue' || field === 'amount') {
          val = val ? parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0 : 0;
        } else if (field === 'customerId') {
          val = val ? parseInt(val, 10) || null : null;
        }
        record[field] = val;
      });
      return record;
    });

    try {
      Toast.info(`Importing ${payload.length} records...`);
      const result = await API.post(`/${this.currentModule}/batch-import`, payload);

      if (result.failureCount > 0) {
        Toast.warning(`Import completed: ${result.successCount} succeeded, ${result.failureCount} failed.`);
      } else {
        Toast.success(`Successfully imported all ${result.successCount} records!`);
      }

      Modal.close('modal-csv-import');

      // Reload active view data
      if (this.currentModule === 'leads' && window.Leads) Leads.load();
      if (this.currentModule === 'customers' && window.Customers) Customers.load();
      if (this.currentModule === 'payments' && window.Payments) Payments.load();
      if (window.Analytics) Analytics.load();
    } catch (err) {
      console.error('Batch import failed:', err);
      Toast.error('Batch import failed. Check console for details.');
    }
  },

  // ==========================================
  // 3. MULTI-SELECT & FLOATING BULK ACTIONS
  // ==========================================
  toggleSelectAll(checkbox, tableContainerId) {
    const isChecked = checkbox.checked;
    const container = document.getElementById(tableContainerId);
    if (!container) return;

    container.querySelectorAll('.row-select-checkbox').forEach(cb => {
      cb.checked = isChecked;
      const id = parseInt(cb.getAttribute('data-id'), 10);
      if (isChecked) {
        this.selectedIds.add(id);
      } else {
        this.selectedIds.delete(id);
      }
    });

    this.updateBulkToolbar();
  },

  toggleRowSelection(checkbox) {
    const id = parseInt(checkbox.getAttribute('data-id'), 10);
    if (checkbox.checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }

    // Sync header select-all checkbox if all visible rows are checked
    const currentTable = checkbox.closest('table');
    if (currentTable) {
      const allRowCbs = currentTable.querySelectorAll('.row-select-checkbox');
      const allChecked = Array.from(allRowCbs).every(cb => cb.checked);
      const selectAllCb = currentTable.querySelector('.select-all-checkbox');
      if (selectAllCb) {
        selectAllCb.checked = allRowCbs.length > 0 && allChecked;
      }
    }

    this.updateBulkToolbar();
  },

  clearSelection() {
    this.selectedIds.clear();
    document.querySelectorAll('.row-select-checkbox, .select-all-checkbox').forEach(cb => {
      cb.checked = false;
    });
    this.updateBulkToolbar();
  },

  updateBulkToolbar() {
    const bar = document.getElementById('bulk-floating-bar');
    const countEl = document.getElementById('bulk-selected-count-label');
    if (!bar) return;

    const count = this.selectedIds.size;
    if (count > 0) {
      bar.classList.add('active');
      let itemLabel = 'items';
      const view = App.currentView || 'leads';
      if (view === 'leads') {
        itemLabel = count === 1 ? 'lead' : 'leads';
      } else if (view === 'customers') {
        itemLabel = count === 1 ? 'customer' : 'customers';
      } else if (view === 'payments') {
        itemLabel = count === 1 ? 'invoice' : 'invoices';
      } else {
        itemLabel = count === 1 ? 'item' : 'items';
      }
      if (countEl) countEl.textContent = `${count} ${itemLabel} selected`;
    } else {
      bar.classList.remove('active');
    }
  },

  exportSelected() {
    if (this.selectedIds.size === 0) {
      Toast.warning('No records selected to export.');
      return;
    }

    const moduleType = App.currentView || 'leads';
    let moduleObj = null;
    if (moduleType === 'leads') moduleObj = window.Leads;
    else if (moduleType === 'customers') moduleObj = window.Customers;
    else if (moduleType === 'payments') moduleObj = window.Payments;
    else {
      const capitalized = moduleType.charAt(0).toUpperCase() + moduleType.slice(1);
      moduleObj = window[capitalized];
    }

    const allRecords = (moduleObj && moduleObj.data && moduleObj.data.content) ? moduleObj.data.content : [];
    const selectedRecords = allRecords.filter(x => this.selectedIds.has(x.id));

    if (!selectedRecords || selectedRecords.length === 0) {
      Toast.warning('No records available to export.');
      return;
    }

    this.exportToCSV(moduleType, selectedRecords);
  },

  async executeBulkDelete() {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${this.selectedIds.size} selected records?`)) return;

    const moduleType = App.currentView || 'leads';
    try {
      await API.post(`/${moduleType}/bulk-action`, {
        ids: Array.from(this.selectedIds),
        action: 'DELETE'
      });
      Toast.success(`Deleted ${this.selectedIds.size} records successfully.`);
      this.clearSelection();
      App.loadViewData(moduleType);
    } catch (err) {
      Toast.error('Bulk deletion failed.');
    }
  },

  async executeBulkStatusUpdate(newStatus) {
    if (this.selectedIds.size === 0) return;

    const moduleType = App.currentView || 'leads';
    try {
      await API.post(`/${moduleType}/bulk-action`, {
        ids: Array.from(this.selectedIds),
        action: 'UPDATE_STATUS',
        statusValue: newStatus
      });
      Toast.success(`Updated status for ${this.selectedIds.size} records.`);
      this.clearSelection();
      App.loadViewData(moduleType);
    } catch (err) {
      Toast.error('Bulk status update failed.');
    }
  }
};

window.DataPortability = DataPortability;
