/**
 * Kanban Module — drag-and-drop opportunity pipeline
 */

const Kanban = {
  leads: [],
  currentSearch: '',
  draggingId: null,
  suppressClickUntil: 0,

  stages: [
    { key: 'NEW', label: 'New' },
    { key: 'CONTACTED', label: 'Contacted' },
    { key: 'QUALIFIED', label: 'Qualified' },
    { key: 'SURVEY_SCHEDULED', label: 'Survey' },
    { key: 'QUOTE_SENT', label: 'Quote Sent' },
    { key: 'WON', label: 'Won' },
    { key: 'LOST', label: 'Lost' }
  ],

  async load() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    board.innerHTML = `<div class="kanban-empty" style="flex:1;">Loading pipeline…</div>`;

    try {
      this.leads = await API.get('/leads/all');
      this.render();
    } catch (err) {
      console.error('Failed to load kanban:', err);
      board.innerHTML = `<div class="kanban-empty">Could not load the pipeline board.</div>`;
    }
  },

  search(val) {
    this.currentSearch = (val || '').trim().toLowerCase();
    this.render();
  },

  filteredLeads() {
    if (!this.currentSearch) return this.leads || [];
    const q = this.currentSearch;
    return (this.leads || []).filter(lead => {
      const hay = [lead.leadCode, lead.name, lead.company, lead.email, lead.assignedUserName]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  },

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  render() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    const leads = this.filteredLeads();
    const grouped = {};
    this.stages.forEach(s => { grouped[s.key] = []; });
    leads.forEach(lead => {
      const key = grouped[lead.status] ? lead.status : 'NEW';
      grouped[key].push(lead);
    });

    board.innerHTML = this.stages.map(stage => {
      const cards = grouped[stage.key] || [];
      const total = cards.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);
      const body = cards.length
        ? cards.map(lead => this.cardHtml(lead)).join('')
        : `<div class="kanban-empty">Drop a card here</div>`;

      return `
        <section class="kanban-column" data-stage="${stage.key}">
          <header class="kanban-column-header">
            <div class="kanban-column-title">
              <span class="kanban-column-name">${stage.label}</span>
              <span class="kanban-column-meta">${Dashboard.formatCurrency(total)}</span>
            </div>
            <span class="kanban-column-count">${cards.length}</span>
          </header>
          <div class="kanban-column-body" data-stage="${stage.key}">
            ${body}
          </div>
        </section>
      `;
    }).join('');

    this.bindBoardEvents(board);
  },

  cardHtml(lead) {
    const name = this.escapeHtml(lead.name);
    const company = this.escapeHtml(lead.company || lead.email || 'Private Account');
    const code = this.escapeHtml(lead.leadCode);
    const assignee = this.escapeHtml(lead.assignedUserName || 'Unassigned');
    return `
      <article class="kanban-card" draggable="true" data-id="${lead.id}" data-status="${this.escapeHtml(lead.status)}">
        <div class="kanban-card-code">${code}</div>
        <h3 class="kanban-card-title">${name}</h3>
        <div class="kanban-card-company">${company}</div>
        <div class="kanban-card-footer">
          <span class="kanban-card-value">${Dashboard.formatCurrency(lead.estimatedValue)}</span>
          <span class="kanban-card-assignee">${assignee}</span>
        </div>
      </article>
    `;
  },

  bindBoardEvents(board) {
    board.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', (e) => this.onDragStart(e, card));
      card.addEventListener('dragend', () => this.onDragEnd());
      card.addEventListener('click', () => {
        if (this.draggingId || Date.now() < this.suppressClickUntil) return;
        Leads.viewLead(Number(card.dataset.id));
      });
    });

    board.querySelectorAll('.kanban-column-body').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.closest('.kanban-column')?.classList.add('is-drop-target');
      });
      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.closest('.kanban-column')?.classList.remove('is-drop-target');
        }
      });
      col.addEventListener('drop', (e) => this.onDrop(e, col));
    });
  },

  onDragStart(e, card) {
    this.draggingId = Number(card.dataset.id);
    card.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(this.draggingId));
  },

  onDragEnd() {
    document.querySelectorAll('.kanban-card.is-dragging').forEach(el => el.classList.remove('is-dragging'));
    document.querySelectorAll('.kanban-column.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
    this.draggingId = null;
    this.suppressClickUntil = Date.now() + 250;
  },

  async onDrop(e, columnBody) {
    e.preventDefault();
    const nextStatus = columnBody.dataset.stage;
    const id = Number(e.dataTransfer.getData('text/plain') || this.draggingId);
    document.querySelectorAll('.kanban-column.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));

    const lead = this.leads.find(l => l.id === id);
    if (!lead || !nextStatus || lead.status === nextStatus) {
      this.onDragEnd();
      return;
    }

    const previousStatus = lead.status;
    lead.status = nextStatus;
    this.render();

    try {
      await API.patch(`/leads/${id}/status`, { status: nextStatus });
      Toast.success(`Moved to ${nextStatus.replaceAll('_', ' ')}`);
      if (window.Dashboard) Dashboard.load();
    } catch (err) {
      lead.status = previousStatus;
      this.render();
      Toast.error(err.message || 'Could not update stage');
    }
  }
};

window.Kanban = Kanban;
