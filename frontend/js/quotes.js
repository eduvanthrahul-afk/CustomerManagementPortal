/**
 * Quotes Module - Proposals, Auto Margin & Profitability Verification
 */

const Quotes = {
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('quotes-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus
      };
      const res = await API.get('/quotes', params);
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load quotes:', err);
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger" style="padding: 2rem;">Error loading quotes.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('quotes-table-body');
    const pagination = document.getElementById('quotes-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div class="empty-state-title">No quotes found</div>
              <div class="empty-state-description">Generate commercial proposals with automated margin and cost safeguards.</div>
              <button class="btn btn-primary" onclick="Quotes.openCreateModal()">+ Create Quote</button>
            </div>
          </td>
        </tr>
      `;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tableBody.innerHTML = res.content.map(q => `
      <tr>
        <td>
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${q.quoteNumber}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark); cursor: pointer;" onclick="Quotes.viewQuote(${q.id})">${q.customerName}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${q.projectType}</span>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-serif); font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(q.amount)}</span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--muted); font-family: var(--font-mono);">${Dashboard.formatCurrency(q.cost)}</span>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; color: ${q.isLowMargin ? 'var(--clay)' : 'var(--green)'};">
              ${q.marginPercentage ? q.marginPercentage.toFixed(1) : '0.0'}%
            </span>
            ${q.isLowMargin ? `
            <span class="badge badge-clay" style="font-size: 0.65rem; padding: 0.05rem 0.35rem;" title="Profit margin below 15% threshold">
              Low
            </span>` : ''}
          </div>
        </td>
        <td>
          <span class="badge ${this.getStatusBadge(q.status)}">
            <span class="badge-dot"></span>${q.status}
          </span>
        </td>
        <td>
          <span class="text-mono" style="font-size: 0.78rem; color: var(--muted);">${q.validUntil || '—'}</span>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            <button class="btn-icon" title="View quote details" onclick="Quotes.viewQuote(${q.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon" title="Edit quote" onclick="Quotes.openEditModal(${q.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Delete quote" onclick="Quotes.deleteQuote(${q.id}, '${q.quoteNumber}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> quotes</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="Quotes.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="Quotes.load(${res.number + 1})">Next</button>
        </div>
      `;
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'ACCEPTED': return 'badge-success';
      case 'SENT': return 'badge-info';
      case 'VIEWED': return 'badge-warning';
      case 'REJECTED':
      case 'EXPIRED': return 'badge-danger';
      default: return 'badge-neutral';
    }
  },

  filterStatus(status) {
    this.currentStatus = status;
    this.load(0);
  },

  search(val) {
    this.currentSearch = val;
    this.load(0);
  },

  calculateMarginInForm() {
    const amt = parseFloat(document.getElementById('quote-amount').value) || 0;
    const cost = parseFloat(document.getElementById('quote-cost').value) || 0;
    const marginDisplay = document.getElementById('quote-margin-calc');
    const marginWarning = document.getElementById('quote-margin-warning');

    const margin = amt - cost;
    const pct = amt > 0 ? (margin / amt) * 100 : 0;

    if (marginDisplay) {
      marginDisplay.textContent = `Margin: ${Dashboard.formatCurrency(margin)} (${pct.toFixed(2)}%)`;
      marginDisplay.style.color = pct < 15 ? 'var(--clay)' : 'var(--green)';
    }

    if (marginWarning) {
      marginWarning.style.display = (pct < 15 && amt > 0) ? 'block' : 'none';
    }
  },

  async openCreateModal() {
    document.getElementById('quote-form').reset();
    document.getElementById('quote-form-id').value = '';
    document.getElementById('quote-modal-title').textContent = 'Generate Commercial Proposal';
    this.calculateMarginInForm();
    await this.populateOptions();
    Modal.open('modal-quote-form');
  },

  async openEditModal(id) {
    try {
      const q = await API.get(`/quotes/${id}`);
      document.getElementById('quote-form-id').value = q.id;
      document.getElementById('quote-project-type').value = q.projectType || '';
      document.getElementById('quote-amount').value = q.amount || '';
      document.getElementById('quote-cost').value = q.cost || '';
      document.getElementById('quote-status').value = q.status || 'DRAFT';
      document.getElementById('quote-valid-until').value = q.validUntil || '';
      document.getElementById('quote-description').value = q.description || '';
      document.getElementById('quote-notes').value = q.notes || '';

      this.calculateMarginInForm();
      await this.populateOptions(q.customerId, q.leadId, q.assignedUserId);
      document.getElementById('quote-modal-title').textContent = 'Edit Quote (' + q.quoteNumber + ')';
      Modal.open('modal-quote-form');
    } catch (err) {
      Toast.error('Could not load quote');
    }
  },

  async populateOptions(selectedCustId = null, selectedLeadId = null, selectedUserId = null) {
    try {
      const [users, customers, leads] = await Promise.all([
        API.get('/users'),
        API.get('/customers/all'),
        API.get('/leads/all')
      ]);

      const custSelect = document.getElementById('quote-customer');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">Select Customer *</option>' +
          customers.map(c => `<option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (${c.company || c.customerCode})</option>`).join('');
      }

      const leadSelect = document.getElementById('quote-lead');
      if (leadSelect) {
        leadSelect.innerHTML = '<option value="">Source Opportunity Lead (Optional)</option>' +
          leads.map(l => `<option value="${l.id}" ${l.id === selectedLeadId ? 'selected' : ''}>${l.leadCode} - ${l.name}</option>`).join('');
      }

      const userSelect = document.getElementById('quote-assigned-user');
      if (userSelect) {
        userSelect.innerHTML = '<option value="">Assigned Solutions Architect</option>' +
          users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.fullName} (${u.title || u.role})</option>`).join('');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async saveQuote(e) {
    e.preventDefault();
    const id = document.getElementById('quote-form-id').value;
    const body = {
      customerId: parseInt(document.getElementById('quote-customer').value),
      leadId: document.getElementById('quote-lead').value ? parseInt(document.getElementById('quote-lead').value) : null,
      projectType: document.getElementById('quote-project-type').value,
      amount: parseFloat(document.getElementById('quote-amount').value) || 0,
      cost: parseFloat(document.getElementById('quote-cost').value) || 0,
      status: document.getElementById('quote-status').value,
      validUntil: document.getElementById('quote-valid-until').value || null,
      assignedUserId: document.getElementById('quote-assigned-user').value ? parseInt(document.getElementById('quote-assigned-user').value) : null,
      description: document.getElementById('quote-description').value,
      notes: document.getElementById('quote-notes').value
    };

    if (!body.customerId || !body.projectType || body.amount < 0) {
      Toast.error('Please complete all required proposal details');
      return;
    }

    try {
      if (id) {
        await API.put(`/quotes/${id}`, body);
        Toast.success('Quote updated');
      } else {
        await API.post('/quotes', body);
        Toast.success('Commercial quote generated');
      }
      Modal.close('modal-quote-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save quote');
    }
  },

  async viewQuote(id) {
    try {
      const q = await API.get(`/quotes/${id}`);
      const drawerBody = document.getElementById('quote-drawer-content');
      if (!drawerBody) return;

      drawerBody.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center" style="padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div>
              <span class="text-mono" style="color: var(--muted); font-size: 0.8rem;">${q.quoteNumber}</span>
              <h2 style="font-size: 1.4rem;">${q.projectType}</h2>
              <div style="font-size: 0.85rem; color: var(--muted);">Client: ${q.customerName}</div>
            </div>
            <span class="badge ${this.getStatusBadge(q.status)}">
              <span class="badge-dot"></span>${q.status}
            </span>
          </div>

          <div class="grid-3-col" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
            <div class="card" style="padding: 0.85rem;">
              <span style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Total Quote</span>
              <div style="font-family: var(--font-serif); font-size: 1.3rem; font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(q.amount)}</div>
            </div>
            <div class="card" style="padding: 0.85rem;">
              <span style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Direct Cost</span>
              <div style="font-family: var(--font-serif); font-size: 1.3rem; font-weight: 600; color: var(--muted);">${Dashboard.formatCurrency(q.cost)}</div>
            </div>
            <div class="card" style="padding: 0.85rem;">
              <span style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Gross Margin</span>
              <div style="font-family: var(--font-mono); font-size: 1.3rem; font-weight: 600; color: ${q.isLowMargin ? 'var(--clay)' : 'var(--green)'};">${q.marginPercentage ? q.marginPercentage.toFixed(1) : '0'}%</div>
            </div>
          </div>

          ${q.isLowMargin ? `
          <div class="auth-alert-box active auth-alert-error" style="font-size: 0.82rem;">
            <strong>Warning:</strong> This quote is currently below the target 15% corporate gross margin threshold. Review supplier costs or adjust pricing before formal execution.
          </div>` : ''}

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Scope & Proposal Description</div>
            <p style="font-size: 0.86rem; color: var(--dark); line-height: 1.5;">${q.description || 'No detailed scope entered.'}</p>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Validity & Personnel</div>
            <div class="flex flex-col gap-2" style="font-size: 0.85rem;">
              <div><strong>Valid Until:</strong> ${q.validUntil || 'Open'}</div>
              <div><strong>Assigned Architect:</strong> ${q.assignedUserName || 'Unassigned'}</div>
            </div>
          </div>

          <div class="flex gap-2" style="padding-top: 1rem; border-top: 1px solid var(--border);">
            <button class="btn btn-primary" onclick="Quotes.updateQuoteStatus(${q.id}, 'ACCEPTED')">Mark Accepted</button>
            <button class="btn btn-secondary" onclick="Quotes.updateQuoteStatus(${q.id}, 'SENT')">Mark Sent</button>
            <button class="btn btn-secondary" onclick="Quotes.openEditModal(${q.id})">Edit</button>
            <button class="btn btn-secondary" onclick="Modal.close('drawer-quote-detail')">Close</button>
          </div>
        </div>
      `;
      Modal.open('drawer-quote-detail');
    } catch (err) {
      Toast.error('Could not load quote details');
    }
  },

  async updateQuoteStatus(id, status) {
    try {
      await API.patch(`/quotes/${id}/status`, { status });
      Toast.success(`Quote marked as ${status}`);
      this.load(this.currentPage);
      Dashboard.load();
      Modal.close('drawer-quote-detail');
    } catch (err) {
      Toast.error('Failed to update quote status');
    }
  },

  deleteQuote(id, quoteNum) {
    Modal.confirm(`Are you sure you want to delete quote ${quoteNum}?`, async () => {
      try {
        await API.delete(`/quotes/${id}`);
        Toast.success('Quote deleted');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete quote');
      }
    }, 'Delete Quote');
  }
};

window.Quotes = Quotes;
