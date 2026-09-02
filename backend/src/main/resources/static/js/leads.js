/**
 * Leads Module - Full CRUD, Search, Filter, Status Change, Notes
 */

const Leads = {
  data: null,
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('leads-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus
      };
      const res = await API.get('/leads', params);
      this.data = res;
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load leads:', err);
      this.data = null;
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 2rem;">Error loading leads from database.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('leads-table-body');
    const pagination = document.getElementById('leads-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="empty-state-title">No leads found</div>
              <div class="empty-state-description">No inbound opportunities match your search criteria or filter.</div>
              <button class="btn btn-primary" onclick="Leads.openCreateModal()">+ Create Lead</button>
            </div>
          </td>
        </tr>
      `;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tableBody.innerHTML = res.content.map(lead => `
      <tr>
        <td style="width: 38px; text-align: center;">
          <input type="checkbox" class="row-select-checkbox" data-id="${lead.id}" onchange="DataPortability.toggleRowSelection(this)" ${DataPortability.selectedIds.has(lead.id) ? 'checked' : ''}>
        </td>
        <td>
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${lead.leadCode}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark); cursor: pointer;" onclick="Leads.viewLead(${lead.id})">${lead.name}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${lead.company || lead.email || '—'}</span>
          </div>
        </td>
        <td>
          <span class="badge ${this.getStatusBadge(lead.status)}">
            <span class="badge-dot"></span>${lead.status}
          </span>
        </td>
        <td>
          <span style="font-family: var(--font-serif); font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(lead.estimatedValue)}</span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--muted);">${lead.source || 'Direct'}</span>
        </td>
        <td>
          <span class="text-mono" style="font-size: 0.78rem; color: var(--muted);">${lead.assignedUserName || 'Unassigned'}</span>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            <button class="btn-icon" title="View details" onclick="Leads.viewLead(${lead.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon" title="Edit lead" onclick="Leads.openEditModal(${lead.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Delete lead" onclick="Leads.deleteLead(${lead.id}, '${lead.name}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    // Pagination
    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> leads</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="Leads.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="Leads.load(${res.number + 1})">Next</button>
        </div>
      `;
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'WON': return 'badge-success';
      case 'QUALIFIED':
      case 'SURVEY_SCHEDULED': return 'badge-info';
      case 'QUOTE_SENT': return 'badge-warning';
      case 'NEW': return 'badge-clay';
      case 'LOST': return 'badge-danger';
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

  async openCreateModal() {
    document.getElementById('lead-form').reset();
    document.getElementById('lead-form-id').value = '';
    document.getElementById('lead-modal-title').textContent = 'Create New Opportunity';
    await this.populateUserAndCustomerOptions();
    Modal.open('modal-lead-form');
  },

  async openEditModal(id) {
    try {
      const lead = await API.get(`/leads/${id}`);
      document.getElementById('lead-form-id').value = lead.id;
      document.getElementById('lead-name').value = lead.name || '';
      document.getElementById('lead-company').value = lead.company || '';
      document.getElementById('lead-email').value = lead.email || '';
      document.getElementById('lead-phone').value = lead.phone || '';
      document.getElementById('lead-source').value = lead.source || 'Website';
      document.getElementById('lead-location').value = lead.location || '';
      document.getElementById('lead-est-val').value = lead.estimatedValue || '';
      document.getElementById('lead-status').value = lead.status || 'NEW';
      document.getElementById('lead-requirement').value = lead.requirement || '';
      document.getElementById('lead-notes').value = lead.notes || '';

      await this.populateUserAndCustomerOptions(lead.assignedUserId, lead.customerId);
      document.getElementById('lead-modal-title').textContent = 'Edit Lead (' + lead.leadCode + ')';
      Modal.open('modal-lead-form');
    } catch (err) {
      Toast.error('Could not load lead details');
    }
  },

  async populateUserAndCustomerOptions(selectedUserId = null, selectedCustomerId = null) {
    try {
      const [users, customers] = await Promise.all([
        API.get('/users'),
        API.get('/customers/all')
      ]);

      const userSelect = document.getElementById('lead-assigned-user');
      if (userSelect) {
        userSelect.innerHTML = '<option value="">Select Staff Member</option>' +
          users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.fullName} (${u.title || u.role})</option>`).join('');
      }

      const custSelect = document.getElementById('lead-customer');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">None / New Client</option>' +
          customers.map(c => `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.name} (${c.company || c.customerCode})</option>`).join('');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async saveLead(e) {
    e.preventDefault();
    const id = document.getElementById('lead-form-id').value;
    const body = {
      name: document.getElementById('lead-name').value,
      company: document.getElementById('lead-company').value,
      email: document.getElementById('lead-email').value,
      phone: document.getElementById('lead-phone').value,
      source: document.getElementById('lead-source').value,
      location: document.getElementById('lead-location').value,
      estimatedValue: parseFloat(document.getElementById('lead-est-val').value) || 0,
      status: document.getElementById('lead-status').value,
      assignedUserId: document.getElementById('lead-assigned-user').value ? parseInt(document.getElementById('lead-assigned-user').value) : null,
      customerId: document.getElementById('lead-customer').value ? parseInt(document.getElementById('lead-customer').value) : null,
      requirement: document.getElementById('lead-requirement').value,
      notes: document.getElementById('lead-notes').value
    };

    try {
      if (id) {
        await API.put(`/leads/${id}`, body);
        Toast.success('Lead updated successfully');
      } else {
        await API.post('/leads', body);
        Toast.success('New lead added to pipeline');
      }
      Modal.close('modal-lead-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save lead');
    }
  },

  async viewLead(id) {
    try {
      const lead = await API.get(`/leads/${id}`);
      const drawerBody = document.getElementById('lead-drawer-content');
      if (!drawerBody) return;

      drawerBody.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center" style="padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div>
              <span class="text-mono" style="color: var(--muted); font-size: 0.8rem;">${lead.leadCode}</span>
              <h2 style="font-size: 1.4rem;">${lead.name}</h2>
              <div style="font-size: 0.85rem; color: var(--muted);">${lead.company || 'Private Account'}</div>
            </div>
            <span class="badge ${this.getStatusBadge(lead.status)}">
              <span class="badge-dot"></span>${lead.status}
            </span>
          </div>

          <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="card" style="padding: 1rem;">
              <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Estimated Value</span>
              <div style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(lead.estimatedValue)}</div>
            </div>
            <div class="card" style="padding: 1rem;">
              <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Assigned Staff</span>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.2rem;">${lead.assignedUserName || 'Unassigned'}</div>
            </div>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Contact & Location</div>
            <div class="flex flex-col gap-2" style="font-size: 0.85rem;">
              <div><strong>Email:</strong> ${lead.email || '—'}</div>
              <div><strong>Phone:</strong> ${lead.phone || '—'}</div>
              <div><strong>Location:</strong> ${lead.location || '—'}</div>
              <div><strong>Lead Source:</strong> ${lead.source || '—'}</div>
            </div>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Project Requirements</div>
            <p style="font-size: 0.86rem; color: var(--dark); line-height: 1.5;">${lead.requirement || 'No detailed specifications entered yet.'}</p>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Internal Notes</div>
            <p style="font-size: 0.86rem; color: var(--dark); line-height: 1.5;">${lead.notes || 'No internal notes recorded.'}</p>
          </div>

          <div class="flex gap-2" style="padding-top: 1rem; border-top: 1px solid var(--border);">
            <button class="btn btn-primary" onclick="Leads.markContacted(${lead.id})">Mark Contacted</button>
            <button class="btn btn-secondary" onclick="Leads.openEditModal(${lead.id})">Edit Lead</button>
            <button class="btn btn-secondary" onclick="Modal.close('drawer-lead-detail')">Close</button>
          </div>
        </div>
      `;
      Modal.open('drawer-lead-detail');
    } catch (err) {
      Toast.error('Could not open lead details');
    }
  },

  async markContacted(id) {
    try {
      await API.post(`/leads/${id}/contact`, {});
      Toast.success('Contact activity logged');
      this.load(this.currentPage);
      Dashboard.load();
      Modal.close('drawer-lead-detail');
    } catch (err) {
      Toast.error('Failed to update lead contact status');
    }
  },

  deleteLead(id, name) {
    Modal.confirm(`Are you sure you want to delete lead "${name}"? This action cannot be undone.`, async () => {
      try {
        await API.delete(`/leads/${id}`);
        Toast.success('Lead deleted successfully');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete lead');
      }
    }, 'Delete Lead');
  }
};

window.Leads = Leads;
