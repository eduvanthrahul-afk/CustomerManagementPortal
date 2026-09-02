/**
 * Projects Module - Delivery, Implementation Milestones & Status Tracking
 */

const Projects = {
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('projects-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus
      };
      const res = await API.get('/projects', params);
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load projects:', err);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 2rem;">Error loading projects.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('projects-table-body');
    const pagination = document.getElementById('projects-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div class="empty-state-title">No active projects found</div>
              <div class="empty-state-description">Track engineering, fabrication, and on-site installations in real-time.</div>
              <button class="btn btn-primary" onclick="Projects.openCreateModal()">+ Create Project</button>
            </div>
          </td>
        </tr>
      `;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tableBody.innerHTML = res.content.map(p => `
      <tr>
        <td>
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${p.projectNumber}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark); cursor: pointer;" onclick="Projects.viewProject(${p.id})">${p.projectName}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${p.customerName} • ${p.location || 'Site'}</span>
          </div>
        </td>
        <td>
          <span class="badge ${this.getStatusBadge(p.status)}">
            <span class="badge-dot"></span>${p.status}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <div style="flex: 1; height: 6px; background: var(--paper-subtle); border-radius: 9999px; overflow: hidden; border: 1px solid var(--border);">
              <div style="width: ${p.progressPercentage || 0}%; height: 100%; background: ${p.status === 'DELAYED' ? 'var(--clay)' : 'var(--green)'};"></div>
            </div>
            <span class="text-mono" style="font-size: 0.74rem; font-weight: 600;">${p.progressPercentage || 0}%</span>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-serif); font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(p.budget)}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span class="text-mono" style="font-size: 0.76rem; color: var(--dark);">${p.expectedCompletion || '—'}</span>
            <span style="font-size: 0.72rem; color: var(--muted);">${p.assignedUserName || 'Unassigned'}</span>
          </div>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            <button class="btn-icon" title="View details" onclick="Projects.viewProject(${p.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon" title="Edit project" onclick="Projects.openEditModal(${p.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Delete project" onclick="Projects.deleteProject(${p.id}, '${p.projectName}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> projects</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="Projects.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="Projects.load(${res.number + 1})">Next</button>
        </div>
      `;
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-info';
      case 'DELAYED': return 'badge-clay';
      case 'CANCELLED': return 'badge-danger';
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
    document.getElementById('project-form').reset();
    document.getElementById('project-form-id').value = '';
    document.getElementById('project-modal-title').textContent = 'Initiate New Project';
    await this.populateOptions();
    Modal.open('modal-project-form');
  },

  async openEditModal(id) {
    try {
      const p = await API.get(`/projects/${id}`);
      document.getElementById('project-form-id').value = p.id;
      document.getElementById('project-name').value = p.projectName || '';
      document.getElementById('project-location').value = p.location || '';
      document.getElementById('project-start-date').value = p.startDate || '';
      document.getElementById('project-expected-completion').value = p.expectedCompletion || '';
      document.getElementById('project-budget').value = p.budget || '';
      document.getElementById('project-progress').value = p.progressPercentage || 0;
      document.getElementById('project-status').value = p.status || 'PLANNED';
      document.getElementById('project-notes').value = p.notes || '';

      await this.populateOptions(p.customerId, p.quoteId, p.assignedUserId);
      document.getElementById('project-modal-title').textContent = 'Edit Project (' + p.projectNumber + ')';
      Modal.open('modal-project-form');
    } catch (err) {
      Toast.error('Could not load project');
    }
  },

  async populateOptions(selectedCustId = null, selectedQuoteId = null, selectedUserId = null) {
    try {
      const [users, customers, quotes] = await Promise.all([
        API.get('/users'),
        API.get('/customers/all'),
        API.get('/quotes/all')
      ]);

      const custSelect = document.getElementById('project-customer');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">Select Customer *</option>' +
          customers.map(c => `<option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (${c.company || c.customerCode})</option>`).join('');
      }

      const quoteSelect = document.getElementById('project-quote');
      if (quoteSelect) {
        quoteSelect.innerHTML = '<option value="">Originating Quote (Optional)</option>' +
          quotes.map(q => `<option value="${q.id}" ${q.id === selectedQuoteId ? 'selected' : ''}>${q.quoteNumber} - ${q.projectType}</option>`).join('');
      }

      const userSelect = document.getElementById('project-assigned-user');
      if (userSelect) {
        userSelect.innerHTML = '<option value="">Field Project Lead</option>' +
          users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.fullName} (${u.title || u.role})</option>`).join('');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('project-form-id').value;
    const body = {
      customerId: parseInt(document.getElementById('project-customer').value),
      quoteId: document.getElementById('project-quote').value ? parseInt(document.getElementById('project-quote').value) : null,
      projectName: document.getElementById('project-name').value,
      location: document.getElementById('project-location').value,
      startDate: document.getElementById('project-start-date').value || null,
      expectedCompletion: document.getElementById('project-expected-completion').value || null,
      budget: parseFloat(document.getElementById('project-budget').value) || 0,
      progressPercentage: parseInt(document.getElementById('project-progress').value) || 0,
      status: document.getElementById('project-status').value,
      assignedUserId: document.getElementById('project-assigned-user').value ? parseInt(document.getElementById('project-assigned-user').value) : null,
      notes: document.getElementById('project-notes').value
    };

    if (!body.customerId || !body.projectName) {
      Toast.error('Please enter customer and project name');
      return;
    }

    try {
      if (id) {
        await API.put(`/projects/${id}`, body);
        Toast.success('Project updated');
      } else {
        await API.post('/projects', body);
        Toast.success('Project initialized');
      }
      Modal.close('modal-project-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save project');
    }
  },

  async viewProject(id) {
    try {
      const p = await API.get(`/projects/${id}`);
      const drawerBody = document.getElementById('project-drawer-content');
      if (!drawerBody) return;

      drawerBody.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center" style="padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div>
              <span class="text-mono" style="color: var(--muted); font-size: 0.8rem;">${p.projectNumber}</span>
              <h2 style="font-size: 1.4rem;">${p.projectName}</h2>
              <div style="font-size: 0.85rem; color: var(--muted);">Client: ${p.customerName}</div>
            </div>
            <span class="badge ${this.getStatusBadge(p.status)}">
              <span class="badge-dot"></span>${p.status}
            </span>
          </div>

          <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="card" style="padding: 1rem;">
              <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Total Budget</span>
              <div style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(p.budget)}</div>
            </div>
            <div class="card" style="padding: 1rem;">
              <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--muted); text-transform: uppercase;">Current Progress</span>
              <div style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 600; color: var(--green);">${p.progressPercentage || 0}%</div>
            </div>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Milestone Timeline</div>
            <div class="flex flex-col gap-2" style="font-size: 0.85rem;">
              <div><strong>Location:</strong> ${p.location || '—'}</div>
              <div><strong>Start Date:</strong> ${p.startDate || '—'}</div>
              <div><strong>Expected Delivery:</strong> ${p.expectedCompletion || '—'}</div>
              <div><strong>Assigned Project Lead:</strong> ${p.assignedUserName || 'Unassigned'}</div>
            </div>
          </div>

          <div class="card" style="padding: 1rem;">
            <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase;">Engineering & Site Notes</div>
            <p style="font-size: 0.86rem; color: var(--dark); line-height: 1.5;">${p.notes || 'No project notes entered.'}</p>
          </div>

          <div class="flex gap-2" style="padding-top: 1rem; border-top: 1px solid var(--border);">
            <button class="btn btn-primary" onclick="Projects.updateStatus(${p.id}, 'COMPLETED')">Mark Completed</button>
            <button class="btn btn-secondary" onclick="Projects.openEditModal(${p.id})">Edit</button>
            <button class="btn btn-secondary" onclick="Modal.close('drawer-project-detail')">Close</button>
          </div>
        </div>
      `;
      Modal.open('drawer-project-detail');
    } catch (err) {
      Toast.error('Could not load project details');
    }
  },

  async updateStatus(id, status) {
    try {
      await API.patch(`/projects/${id}/status`, { status });
      Toast.success(`Project marked as ${status}`);
      this.load(this.currentPage);
      Dashboard.load();
      Modal.close('drawer-project-detail');
    } catch (err) {
      Toast.error('Failed to update project status');
    }
  },

  deleteProject(id, name) {
    Modal.confirm(`Are you sure you want to delete project "${name}"?`, async () => {
      try {
        await API.delete(`/projects/${id}`);
        Toast.success('Project deleted');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete project');
      }
    }, 'Delete Project');
  }
};

window.Projects = Projects;
