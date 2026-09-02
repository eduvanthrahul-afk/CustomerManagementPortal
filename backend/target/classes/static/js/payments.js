/**
 * Payments & Collections Module - Overdue Invoices, Collection Status, Clear Invoices
 */

const Payments = {
  data: null,
  currentPage: 0,
  pageSize: 15,
  currentStatus: '',
  currentSearch: '',

  async load(page = 0) {
    this.currentPage = page;
    const tableBody = document.getElementById('payments-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;"><div class="skeleton" style="height: 24px; width: 80%; margin: 0 auto;"></div></td></tr>`;

    try {
      const params = {
        page: this.currentPage,
        size: this.pageSize,
        search: this.currentSearch,
        status: this.currentStatus
      };
      const res = await API.get('/payments', params);
      this.data = res;
      this.renderTable(res);
    } catch (err) {
      console.error('Failed to load payments:', err);
      this.data = null;
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 2rem;">Error loading payments.</td></tr>`;
    }
  },

  renderTable(res) {
    const tableBody = document.getElementById('payments-table-body');
    const pagination = document.getElementById('payments-pagination');
    if (!tableBody) return;

    if (!res.content || res.content.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div class="empty-state-title">No payment records found</div>
              <div class="empty-state-description">Issue milestone invoices and record client collections.</div>
              <button class="btn btn-primary" onclick="Payments.openCreateModal()">+ Issue Invoice</button>
            </div>
          </td>
        </tr>
      `;
      if (pagination) pagination.innerHTML = '';
      return;
    }

    tableBody.innerHTML = res.content.map(p => `
      <tr>
        <td style="width: 38px; text-align: center;">
          <input type="checkbox" class="row-select-checkbox" data-id="${p.id}" onchange="DataPortability.toggleRowSelection(this)" ${DataPortability.selectedIds.has(p.id) ? 'checked' : ''}>
        </td>
        <td>
          <span class="text-mono" style="font-weight: 600; color: var(--dark);">${p.paymentCode}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span style="font-weight: 600; color: var(--dark);">${p.customerName}</span>
            <span style="font-size: 0.76rem; color: var(--muted);">${p.projectName || p.referenceNumber || '—'}</span>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; color: var(--dark);">${Dashboard.formatCurrency(p.amount)}</span>
        </td>
        <td>
          <div class="flex flex-col">
            <span class="text-mono" style="font-size: 0.8rem; font-weight: 600; color: ${p.isOverdue ? 'var(--clay)' : 'var(--dark)'};">${p.dueDate}</span>
            ${p.isOverdue ? '<span class="text-clay font-semibold" style="font-size: 0.68rem;">OVERDUE</span>' : ''}
          </div>
        </td>
        <td>
          <span class="badge ${this.getStatusBadge(p.status, p.isOverdue)}">
            <span class="badge-dot"></span>${p.status}
          </span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--muted);">${p.paymentMethod || 'Bank Transfer'}</span>
        </td>
        <td>
          <div class="flex gap-1 justify-end">
            ${p.status !== 'PAID' ? `
            <button class="btn btn-sm btn-primary" title="Record Receipt" onclick="Payments.openMarkPaidModal(${p.id})">
              Record Paid
            </button>` : ''}
            <button class="btn-icon" title="Edit invoice" onclick="Payments.openEditModal(${p.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.isAdmin() ? `
            <button class="btn-icon text-danger" title="Delete payment" onclick="Payments.deletePayment(${p.id}, '${p.paymentCode}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <div>Showing <strong>${res.number * res.size + 1}</strong> to <strong>${Math.min((res.number + 1) * res.size, res.totalElements)}</strong> of <strong>${res.totalElements}</strong> invoices</div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" ${res.first ? 'disabled' : ''} onclick="Payments.load(${res.number - 1})">Previous</button>
          <button class="btn btn-sm btn-secondary" ${res.last ? 'disabled' : ''} onclick="Payments.load(${res.number + 1})">Next</button>
        </div>
      `;
    }
  },

  getStatusBadge(status, isOverdue) {
    if (status === 'PAID') return 'badge-success';
    if (status === 'OVERDUE' || isOverdue) return 'badge-clay';
    if (status === 'DUE') return 'badge-warning';
    return 'badge-neutral';
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
    document.getElementById('payment-form').reset();
    document.getElementById('payment-form-id').value = '';
    document.getElementById('payment-modal-title').textContent = 'Issue Milestone Invoice';
    await this.populateOptions();
    Modal.open('modal-payment-form');
  },

  async openEditModal(id) {
    try {
      const p = await API.get(`/payments/${id}`);
      document.getElementById('payment-form-id').value = p.id;
      document.getElementById('payment-amount').value = p.amount || '';
      document.getElementById('payment-due-date').value = p.dueDate || '';
      document.getElementById('payment-date').value = p.paymentDate || '';
      document.getElementById('payment-method').value = p.paymentMethod || 'Bank Transfer';
      document.getElementById('payment-status').value = p.status || 'DUE';
      document.getElementById('payment-ref').value = p.referenceNumber || '';
      document.getElementById('payment-notes').value = p.notes || '';

      await this.populateOptions(p.customerId, p.projectId);
      document.getElementById('payment-modal-title').textContent = 'Edit Invoice (' + p.paymentCode + ')';
      Modal.open('modal-payment-form');
    } catch (err) {
      Toast.error('Could not load payment');
    }
  },

  async populateOptions(selectedCustId = null, selectedProjId = null) {
    try {
      const [customers, projects] = await Promise.all([
        API.get('/customers/all'),
        API.get('/projects/all')
      ]);

      const custSelect = document.getElementById('payment-customer');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">Select Customer *</option>' +
          customers.map(c => `<option value="${c.id}" ${c.id === selectedCustId ? 'selected' : ''}>${c.name} (${c.company || c.customerCode})</option>`).join('');
      }

      const projSelect = document.getElementById('payment-project');
      if (projSelect) {
        projSelect.innerHTML = '<option value="">Associated Project (Optional)</option>' +
          projects.map(p => `<option value="${p.id}" ${p.id === selectedProjId ? 'selected' : ''}>${p.projectNumber} - ${p.projectName}</option>`).join('');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async savePayment(e) {
    e.preventDefault();
    const id = document.getElementById('payment-form-id').value;
    const body = {
      customerId: parseInt(document.getElementById('payment-customer').value),
      projectId: document.getElementById('payment-project').value ? parseInt(document.getElementById('payment-project').value) : null,
      amount: parseFloat(document.getElementById('payment-amount').value) || 0,
      dueDate: document.getElementById('payment-due-date').value,
      paymentDate: document.getElementById('payment-date').value || null,
      paymentMethod: document.getElementById('payment-method').value,
      status: document.getElementById('payment-status').value,
      referenceNumber: document.getElementById('payment-ref').value,
      notes: document.getElementById('payment-notes').value
    };

    if (!body.customerId || !body.dueDate || body.amount <= 0) {
      Toast.error('Please enter valid invoice details and amount');
      return;
    }

    try {
      if (id) {
        await API.put(`/payments/${id}`, body);
        Toast.success('Payment invoice updated');
      } else {
        await API.post('/payments', body);
        Toast.success('Invoice issued');
      }
      Modal.close('modal-payment-form');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error(err.message || 'Failed to save payment');
    }
  },

  openMarkPaidModal(id) {
    document.getElementById('mark-paid-id').value = id;
    document.getElementById('mark-paid-method').value = 'Wire Transfer';
    document.getElementById('mark-paid-ref').value = 'REF-' + Date.now().toString().slice(-6);
    Modal.open('modal-mark-paid');
  },

  async submitMarkPaid(e) {
    e.preventDefault();
    const id = document.getElementById('mark-paid-id').value;
    const paymentMethod = document.getElementById('mark-paid-method').value;
    const referenceNumber = document.getElementById('mark-paid-ref').value;

    try {
      await API.post(`/payments/${id}/pay`, { paymentMethod, referenceNumber });
      Toast.success('Payment recorded successfully');
      Modal.close('modal-mark-paid');
      this.load(this.currentPage);
      Dashboard.load();
    } catch (err) {
      Toast.error('Failed to clear invoice');
    }
  },

  deletePayment(id, code) {
    Modal.confirm(`Are you sure you want to delete invoice ${code}?`, async () => {
      try {
        await API.delete(`/payments/${id}`);
        Toast.success('Payment deleted');
        this.load(this.currentPage);
        Dashboard.load();
      } catch (err) {
        Toast.error(err.message || 'Failed to delete payment');
      }
    }, 'Delete Invoice');
  }
};

window.Payments = Payments;
