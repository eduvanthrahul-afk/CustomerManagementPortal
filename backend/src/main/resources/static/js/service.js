/**
 * Service & Warranty Module - Aftercare Ticketing, Resolution, and Warranty Operations
 */

const ServiceTickets = {
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentPriority: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('service-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus,
        priority: this.currentPriority
      };
      const res = await API.get('/service-requests', params);
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load service requests:', err);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 2rem;">Error loading aftercare tickets.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('service-table-body');
    const pagination = document.getElementById('service-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div class="empty-state-title">No service tickets found</div>
              <div class="empty-state-description">Track warranty cases, diagnostic dispatches, and aftercare maintenance.</div>
              <button class="btn btn-primary" onclick="ServiceTickets.openCreateModal()">+ Open Ticket</button>
            </div>
          </td>
        </tr>
      `;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tableBody.innerHTML = res.content.map(s => `
      <tr>
        <td>
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${s.ticketCode}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark);">${s.issue}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${s.customerName}</span>
          </div>
        </td>
        <td>
          <span class="badge ${this.getPriorityBadge(s.priority)}">
            <span class="badge-dot"></span>${s.priority}
          </span>
        </td>
        <td>
          <span class="badge ${this.getStatusBadge(s.status)}">
            <span class="badge-dot"></span>${s.status}
          </span>
        </td>
        <td>
          <span class="text-mono" style="font-size: 0.78rem; color: var(--muted);">${s.dueDate || '—'}</span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--muted);">${s.assignedUserName || 'Unassigned'}</span>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            <button class="btn-icon" title="Edit ticket" onclick="ServiceTickets.openEditModal(${s.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Delete ticket" onclick="ServiceTickets.deleteTicket(${s.id}, '${s.ticketCode}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> tickets</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="ServiceTickets.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="ServiceTickets.load(${res.number + 1})">Next</button>
        </div>
      `;
    }
  },

  getPriorityBadge(priority) {
    switch (priority) {
      case 'URGENT': return 'badge-danger';
      case 'HIGH': return 'badge-clay';
      case 'MEDIUM': return 'badge-warning';
      default: return 'badge-neutral';
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-info';
      case 'WAITING': return 'badge-warning';
      default: return 'badge-clay';
    }
  },

  filterStatus(status) {
    this.currentStatus = status;
    this.load(0);
  },

  filterPriority(priority) {
    this.currentPriority = priority;
    this.load(0);
  },

  search(val) {
    this.currentSearch = val;
    this.load(0);
  },

  async openCreateModal() {
    document.getElementById('service-form').reset();
    document.getElementById('service-form-id').value = '';
    document.getElementById('service-modal-title').textContent = 'Open Service / Warranty Case';
    await this.populateOptions();
    Modal.open('modal-service-form');
  },

  async openEditModal(id) {
    try {
      const s = await API.get(`/service-requests/${id}`);
      document.getElementById('service-form-id').value = s.id;
      document.getElementById('service-issue').value = s.issue || '';
      document.getElementById('service-description').value = s.description || '';
      document.getElementById('service-priority').value = s.priority || 'MEDIUM';
      document.getElementById('service-status').value = s.status || 'OPEN';
      document.getElementById('service-due-date').value = s.dueDate || '';
      document.getElementById('service-resolution').value = s.resolution || '';
      document.getElementById('service-notes').value = s.notes || '';

      await this.populateOptions(s.customerId, s.projectId, s.assignedUserId);
      document.getElementById('service-modal-title').textContent = 'Edit Ticket (' + s.ticketCode + ')';
      Modal.open('modal-service-form');
    } catch (err) {
      Toast.error('Could not load service ticket');
    }
  },

  async populateOptions(selectedCustId = null, selectedProjId = null, selectedUserId = null) {
    try {
      const [users, customers, projects] = await Promise.all([
        API.get('/users'),
        API.get('/customers/all'),
        API.get('/projects/all')
      ]);

      const custSelect = document.getElementById('service-customer');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">Select Customer *</option>' +
          customers.map(c => `<option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (${c.company || c.customerCode})</option>`).join('');
      }

      const projSelect = document.getElementById('service-project');
      if (projSelect) {
        projSelect.innerHTML = '<option value="">Installed Project System (Optional)</option>' +
          projects.map(p => `<option value="${p.id}" ${p.id === selectedProjId ? 'selected' : ''}>${p.projectNumber} - ${p.projectName}</option>`).join('');
      }

      const userSelect = document.getElementById('service-assigned-user');
      if (userSelect) {
        userSelect.innerHTML = '<option value="">Assign Support Specialist</option>' +
          users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.fullName} (${u.title || u.role})</option>`).join('');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async saveServiceTicket(e) {
    e.preventDefault();
    const id = document.getElementById('service-form-id').value;
    const body = {
      customerId: parseInt(document.getElementById('service-customer').value),
      projectId: document.getElementById('service-project').value ? parseInt(document.getElementById('service-project').value) : null,
      issue: document.getElementById('service-issue').value,
      description: document.getElementById('service-description').value,
      priority: document.getElementById('service-priority').value,
      status: document.getElementById('service-status').value,
      dueDate: document.getElementById('service-due-date').value || null,
      assignedUserId: document.getElementById('service-assigned-user').value ? parseInt(document.getElementById('service-assigned-user').value) : null,
      resolution: document.getElementById('service-resolution').value,
      notes: document.getElementById('service-notes').value
    };

    if (!body.customerId || !body.issue) {
      Toast.error('Please enter customer and issue summary');
      return;
    }

    try {
      if (id) {
        await API.put(`/service-requests/${id}`, body);
        Toast.success('Service ticket updated');
      } else {
        await API.post('/service-requests', body);
        Toast.success('Service ticket opened');
      }
      Modal.close('modal-service-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save ticket');
    }
  },

  deleteTicket(id, code) {
    Modal.confirm(`Are you sure you want to delete service ticket ${code}?`, async () => {
      try {
        await API.delete(`/service-requests/${id}`);
        Toast.success('Service ticket deleted');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete service ticket');
      }
    }, 'Delete Ticket');
  }
};

window.ServiceTickets = ServiceTickets;
