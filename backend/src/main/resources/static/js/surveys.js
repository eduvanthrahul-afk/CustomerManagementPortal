/**
 * Site Surveys Module - Scheduling, Measurements, Status Tracking
 */

const Surveys = {
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('surveys-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus
      };
      const res = await API.get('/surveys', params);
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load surveys:', err);
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger" style="padding: 2rem;">Error loading site surveys.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('surveys-table-body');
    const pagination = document.getElementById('surveys-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div class="empty-state-title">No site surveys found</div>
              <div class="empty-state-description">Schedule on-site technical evaluations and measurements for client projects.</div>
              <button class="btn btn-primary" onclick="Surveys.openCreateModal()">+ Schedule Survey</button>
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
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${s.surveyCode}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark);">${s.customerName}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${s.address}</span>
          </div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <span class="text-mono" style="font-size: 0.8rem; font-weight: 600;">${s.surveyDate}</span>
            <span class="badge badge-neutral">${s.surveyTime || '10:00 AM'}</span>
          </div>
        </td>
        <td>
          <span class="badge ${s.status === 'COMPLETED' ? 'badge-success' : (s.status === 'CANCELLED' ? 'badge-danger' : 'badge-info')}">
            <span class="badge-dot"></span>${s.status}
          </span>
        </td>
        <td>
          <span class="text-mono" style="font-size: 0.78rem; color: var(--muted);">${s.assignedUserName || 'Unassigned'}</span>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            ${s.status !== 'COMPLETED' ? `
            <button class="btn btn-sm btn-primary" title="Complete Survey" onclick="Surveys.openCompleteModal(${s.id})">
              Complete
            </button>` : ''}
            <button class="btn-icon" title="Edit appointment" onclick="Surveys.openEditModal(${s.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Cancel/Delete" onclick="Surveys.deleteSurvey(${s.id}, '${s.surveyCode}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> surveys</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="Surveys.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="Surveys.load(${res.number + 1})">Next</button>
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

  async openCreateModal() {
    document.getElementById('survey-form').reset();
    document.getElementById('survey-form-id').value = '';
    document.getElementById('survey-modal-title').textContent = 'Schedule Site Survey';
    await this.populateOptions();
    Modal.open('modal-survey-form');
  },

  async openEditModal(id) {
    try {
      const s = await API.get(`/surveys/${id}`);
      document.getElementById('survey-form-id').value = s.id;
      document.getElementById('survey-address').value = s.address || '';
      document.getElementById('survey-date').value = s.surveyDate || '';
      document.getElementById('survey-time').value = s.surveyTime || '10:00 AM';
      document.getElementById('survey-status').value = s.status || 'SCHEDULED';
      document.getElementById('survey-measurements').value = s.measurements || '';
      document.getElementById('survey-notes').value = s.notes || '';

      await this.populateOptions(s.customerId, s.leadId, s.assignedUserId);
      document.getElementById('survey-modal-title').textContent = 'Edit Survey (' + s.surveyCode + ')';
      Modal.open('modal-survey-form');
    } catch (err) {
      Toast.error('Could not load survey');
    }
  },

  async populateOptions(selectedCustId = null, selectedLeadId = null, selectedUserId = null) {
    try {
      const [users, customers, leads] = await Promise.all([
        API.get('/users'),
        API.get('/customers/all'),
        API.get('/leads/all')
      ]);

      const custSelect = document.getElementById('survey-customer');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">Select Customer *</option>' +
          customers.map(c => `<option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (${c.company || c.customerCode})</option>`).join('');
      }

      const leadSelect = document.getElementById('survey-lead');
      if (leadSelect) {
        leadSelect.innerHTML = '<option value="">Associated Lead (Optional)</option>' +
          leads.map(l => `<option value="${l.id}" ${l.id === selectedLeadId ? 'selected' : ''}>${l.leadCode} - ${l.name}</option>`).join('');
      }

      const userSelect = document.getElementById('survey-assigned-user');
      if (userSelect) {
        userSelect.innerHTML = '<option value="">Assign Field Lead</option>' +
          users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.fullName} (${u.title || u.role})</option>`).join('');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async saveSurvey(e) {
    e.preventDefault();
    const id = document.getElementById('survey-form-id').value;
    const body = {
      customerId: parseInt(document.getElementById('survey-customer').value),
      leadId: document.getElementById('survey-lead').value ? parseInt(document.getElementById('survey-lead').value) : null,
      address: document.getElementById('survey-address').value,
      surveyDate: document.getElementById('survey-date').value,
      surveyTime: document.getElementById('survey-time').value,
      status: document.getElementById('survey-status').value,
      assignedUserId: document.getElementById('survey-assigned-user').value ? parseInt(document.getElementById('survey-assigned-user').value) : null,
      measurements: document.getElementById('survey-measurements').value,
      notes: document.getElementById('survey-notes').value
    };

    if (!body.customerId || !body.address || !body.surveyDate) {
      Toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (id) {
        await API.put(`/surveys/${id}`, body);
        Toast.success('Survey updated');
      } else {
        await API.post('/surveys', body);
        Toast.success('Survey scheduled successfully');
      }
      Modal.close('modal-survey-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save survey');
    }
  },

  openCompleteModal(id) {
    document.getElementById('complete-survey-id').value = id;
    document.getElementById('complete-survey-measurements').value = '';
    document.getElementById('complete-survey-notes').value = '';
    Modal.open('modal-complete-survey');
  },

  async submitCompleteSurvey(e) {
    e.preventDefault();
    const id = document.getElementById('complete-survey-id').value;
    const measurements = document.getElementById('complete-survey-measurements').value;
    const notes = document.getElementById('complete-survey-notes').value;

    try {
      await API.post(`/surveys/${id}/complete`, { measurements, notes });
      Toast.success('Survey marked as completed');
      Modal.close('modal-complete-survey');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error('Failed to complete survey');
    }
  },

  deleteSurvey(id, code) {
    Modal.confirm(`Are you sure you want to cancel survey ${code}?`, async () => {
      try {
        await API.delete(`/surveys/${id}`);
        Toast.success('Survey deleted');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete survey');
      }
    }, 'Cancel Survey');
  }
};

window.Surveys = Surveys;
