/**
 * Customers Module - 360-Degree Account Relationship Overview & Management
 */

const Customers = {
  data: null,
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('customers-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus
      };
      const res = await API.get('/customers', params);
      this.data = res;
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load customers:', err);
      this.data = null;
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 2rem;">Error loading customers.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('customers-table-body');
    const pagination = document.getElementById('customers-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="empty-state-title">No client accounts found</div>
              <div class="empty-state-description">Add and manage client portfolios and view complete 360-degree account activity.</div>
              <button class="btn btn-primary" onclick="Customers.openCreateModal()">+ Add Customer</button>
            </div>
          </td>
        </tr>
      `;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tableBody.innerHTML = res.content.map(c => `
      <tr>
        <td style="width: 38px; text-align: center;">
          <input type="checkbox" class="row-select-checkbox" data-id="${c.id}" onchange="DataPortability.toggleRowSelection(this)" ${DataPortability.selectedIds.has(c.id) ? 'checked' : ''}>
        </td>
        <td>
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${c.customerCode}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark); cursor: pointer;" onclick="Customers.view360(${c.id})">${c.name}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${c.company || 'Direct'}</span>
          </div>
        </td>
        <td>
          <div class="flex flex-col" style="font-size: 0.82rem;">
            <span>${c.email}</span>
            <span style="color: var(--muted);">${c.phone || '—'}</span>
          </div>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--muted);">${c.city || '—'}</span>
        </td>
        <td>
          <span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}">
            <span class="badge-dot"></span>${c.status}
          </span>
        </td>
        <td>
          <span style="font-family: var(--font-serif); font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(c.totalValue)}</span>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            <button class="btn btn-sm btn-secondary" title="View 360 Profile" onclick="Customers.view360(${c.id})">
              360° View
            </button>
            <button class="btn-icon" title="Edit customer" onclick="Customers.openEditModal(${c.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Delete customer" onclick="Customers.deleteCustomer(${c.id}, '${c.name}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> customers</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="Customers.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="Customers.load(${res.number + 1})">Next</button>
        </div>
      `;
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

  openCreateModal() {
    document.getElementById('customer-form').reset();
    document.getElementById('customer-form-id').value = '';
    document.getElementById('customer-modal-title').textContent = 'Add Client Account';
    Modal.open('modal-customer-form');
  },

  async openEditModal(id) {
    try {
      const c = await API.get(`/customers/${id}`);
      document.getElementById('customer-form-id').value = c.id;
      document.getElementById('customer-name').value = c.name || '';
      document.getElementById('customer-company').value = c.company || '';
      document.getElementById('customer-email').value = c.email || '';
      document.getElementById('customer-phone').value = c.phone || '';
      document.getElementById('customer-address').value = c.address || '';
      document.getElementById('customer-city').value = c.city || '';
      document.getElementById('customer-status').value = c.status || 'ACTIVE';
      document.getElementById('customer-notes').value = c.notes || '';

      document.getElementById('customer-modal-title').textContent = 'Edit Customer (' + c.customerCode + ')';
      Modal.open('modal-customer-form');
    } catch (err) {
      Toast.error('Could not load customer details');
    }
  },

  async saveCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('customer-form-id').value;
    const body = {
      name: document.getElementById('customer-name').value,
      company: document.getElementById('customer-company').value,
      email: document.getElementById('customer-email').value,
      phone: document.getElementById('customer-phone').value,
      address: document.getElementById('customer-address').value,
      city: document.getElementById('customer-city').value,
      status: document.getElementById('customer-status').value,
      notes: document.getElementById('customer-notes').value
    };

    if (!body.name || !body.email) {
      Toast.error('Please provide name and email address');
      return;
    }

    try {
      if (id) {
        await API.put(`/customers/${id}`, body);
        Toast.success('Customer updated');
      } else {
        await API.post('/customers', body);
        Toast.success('Customer account registered');
      }
      Modal.close('modal-customer-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save customer');
    }
  },

  async view360(id) {
    try {
      const data = await API.get(`/customers/${id}/360`);
      const c = data.customer;
      const drawerBody = document.getElementById('customer-360-content');
      if (!drawerBody) return;

      drawerBody.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center" style="padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div>
              <span class="text-mono" style="color: var(--muted); font-size: 0.8rem;">${c.customerCode}</span>
              <h2 style="font-size: 1.4rem;">${c.name}</h2>
              <div style="font-size: 0.85rem; color: var(--muted);">${c.company || 'Private Account'} • ${c.city || 'Headquarters'}</div>
            </div>
            <span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}">
              <span class="badge-dot"></span>${c.status}
            </span>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Direct Contact & Location</div>
            <div class="flex flex-col gap-2" style="font-size: 0.85rem;">
              <div><strong>Email:</strong> ${c.email}</div>
              <div><strong>Phone:</strong> ${c.phone || '—'}</div>
              <div><strong>Address:</strong> ${c.address || '—'}</div>
              <div><strong>Client Since:</strong> ${c.customerSince || '—'}</div>
            </div>
          </div>

          <!-- Customer Relationships Sections -->
          <div class="card" style="padding: 1rem;">
            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; font-weight: 600; text-transform: uppercase; font-family: var(--font-mono);">Quotes (${data.quotes.length})</span>
            </div>
            ${data.quotes.length === 0 ? '<div class="text-muted" style="font-size: 0.8rem;">No proposals issued.</div>' : `
              <div class="flex flex-col gap-2">
                ${data.quotes.map(q => `
                  <div class="flex justify-between items-center" style="padding: 0.4rem 0; border-bottom: 1px solid var(--border-light); font-size: 0.82rem;">
                    <div>
                      <strong>${q.quoteNumber}</strong> - ${q.projectType}
                    </div>
                    <div class="flex items-center gap-2">
                      <span style="font-family: var(--font-serif); font-weight: 600;">${Dashboard.formatCurrency(q.amount)}</span>
                      <span class="badge ${Quotes.getStatusBadge(q.status)}">${q.status}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="card" style="padding: 1rem;">
            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; font-weight: 600; text-transform: uppercase; font-family: var(--font-mono);">Active Projects (${data.projects.length})</span>
            </div>
            ${data.projects.length === 0 ? '<div class="text-muted" style="font-size: 0.8rem;">No active projects.</div>' : `
              <div class="flex flex-col gap-2">
                ${data.projects.map(p => `
                  <div class="flex justify-between items-center" style="padding: 0.4rem 0; border-bottom: 1px solid var(--border-light); font-size: 0.82rem;">
                    <div>
                      <strong>${p.projectNumber}</strong>: ${p.projectName}
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-mono" style="font-size: 0.76rem;">${p.progressPercentage}%</span>
                      <span class="badge ${Projects.getStatusBadge(p.status)}">${p.status}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="card" style="padding: 1rem;">
            <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; font-weight: 600; text-transform: uppercase; font-family: var(--font-mono);">Invoices & Payments (${data.payments.length})</span>
            </div>
            ${data.payments.length === 0 ? '<div class="text-muted" style="font-size: 0.8rem;">No invoice history.</div>' : `
              <div class="flex flex-col gap-2">
                ${data.payments.map(pay => `
                  <div class="flex justify-between items-center" style="padding: 0.4rem 0; border-bottom: 1px solid var(--border-light); font-size: 0.82rem;">
                    <div>
                      <strong>${pay.paymentCode}</strong> (Due ${pay.dueDate})
                    </div>
                    <div class="flex items-center gap-2">
                      <span style="font-family: var(--font-serif); font-weight: 600;">${Dashboard.formatCurrency(pay.amount)}</span>
                      <span class="badge ${Payments.getStatusBadge(pay.status, pay.isOverdue)}">${pay.status}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="flex gap-2" style="padding-top: 1rem; border-top: 1px solid var(--border);">
            <button class="btn btn-secondary" onclick="Customers.openEditModal(${c.id})">Edit Profile</button>
            <button class="btn btn-secondary" onclick="Modal.close('drawer-customer-360')">Close</button>
          </div>
        </div>
      `;
      Modal.open('drawer-customer-360');
    } catch (err) {
      Toast.error('Could not load 360 customer profile');
    }
  },

  deleteCustomer(id, name) {
    Modal.confirm(`Are you sure you want to delete customer "${name}"? This will remove related account records.`, async () => {
      try {
        await API.delete(`/customers/${id}`);
        Toast.success('Customer removed');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete customer');
      }
    }, 'Delete Customer');
  }
};

window.Customers = Customers;
