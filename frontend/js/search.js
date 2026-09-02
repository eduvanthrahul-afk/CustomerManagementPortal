/**
 * Global Search Module - Live Omni-Search with Real Backend Querying
 */

const GlobalSearch = {
  debounceTimer: null,
  menuEl: null,

  init() {
    const input = document.getElementById('global-search-input');
    this.menuEl = document.getElementById('global-search-results');

    if (!input || !this.menuEl) return;

    input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        this.menuEl.classList.remove('open');
        this.menuEl.innerHTML = '';
        return;
      }

      this.debounceTimer = setTimeout(() => {
        this.performSearch(query);
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-wrapper')) {
        this.menuEl.classList.remove('open');
      }
    });

    // Keyboard shortcut '/' or 'Cmd+K'
    document.addEventListener('keydown', (e) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  },

  async performSearch(query) {
    try {
      const res = await API.get('/search', { q: query });
      this.renderResults(res);
    } catch (err) {
      console.error('Search error:', err);
    }
  },

  renderResults(res) {
    if (!this.menuEl) return;

    if (res.totalResults === 0) {
      this.menuEl.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--muted); font-size: 0.84rem;">
          No matching records found for "<strong>${res.query}</strong>"
        </div>
      `;
      this.menuEl.classList.add('open');
      return;
    }

    let html = '';

    if (res.leads && res.leads.length > 0) {
      html += `<div class="search-category-header">Leads & Opportunities (${res.leads.length})</div>`;
      html += res.leads.map(l => `
        <div class="search-result-row" onclick="GlobalSearch.selectItem('LEAD', ${l.id})">
          <div class="flex flex-col">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--dark);">${l.title}</span>
            <span style="font-size: 0.74rem; color: var(--muted);">${l.code} • ${l.subtitle || ''}</span>
          </div>
          <div class="flex items-center gap-2">
            <span style="font-family: var(--font-serif); font-size: 0.85rem; font-weight: 600;">${Dashboard.formatCurrency(l.value)}</span>
            <span class="badge badge-${l.badgeType}">${l.status}</span>
          </div>
        </div>
      `).join('');
    }

    if (res.customers && res.customers.length > 0) {
      html += `<div class="search-category-header">Client Accounts (${res.customers.length})</div>`;
      html += res.customers.map(c => `
        <div class="search-result-row" onclick="GlobalSearch.selectItem('CUSTOMER', ${c.id})">
          <div class="flex flex-col">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--dark);">${c.title}</span>
            <span style="font-size: 0.74rem; color: var(--muted);">${c.code} • ${c.subtitle || ''}</span>
          </div>
          <span class="badge badge-success">${c.status}</span>
        </div>
      `).join('');
    }

    if (res.quotes && res.quotes.length > 0) {
      html += `<div class="search-category-header">Proposals & Quotes (${res.quotes.length})</div>`;
      html += res.quotes.map(q => `
        <div class="search-result-row" onclick="GlobalSearch.selectItem('QUOTE', ${q.id})">
          <div class="flex flex-col">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--dark);">${q.code} — ${q.title}</span>
            <span style="font-size: 0.74rem; color: var(--muted);">${q.subtitle}</span>
          </div>
          <span style="font-family: var(--font-serif); font-size: 0.85rem; font-weight: 600;">${Dashboard.formatCurrency(q.value)}</span>
        </div>
      `).join('');
    }

    if (res.projects && res.projects.length > 0) {
      html += `<div class="search-category-header">Projects In-Flight (${res.projects.length})</div>`;
      html += res.projects.map(p => `
        <div class="search-result-row" onclick="GlobalSearch.selectItem('PROJECT', ${p.id})">
          <div class="flex flex-col">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--dark);">${p.title}</span>
            <span style="font-size: 0.74rem; color: var(--muted);">${p.code} • ${p.subtitle}</span>
          </div>
          <span class="badge badge-${p.badgeType}">${p.status}</span>
        </div>
      `).join('');
    }

    if (res.payments && res.payments.length > 0) {
      html += `<div class="search-category-header">Payments & Invoices (${res.payments.length})</div>`;
      html += res.payments.map(pay => `
        <div class="search-result-row" onclick="GlobalSearch.selectItem('PAYMENT', ${pay.id})">
          <div class="flex flex-col">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--dark);">${pay.code} — ${pay.title}</span>
            <span style="font-size: 0.74rem; color: var(--muted);">${pay.subtitle}</span>
          </div>
          <span class="badge badge-${pay.badgeType}">${pay.status}</span>
        </div>
      `).join('');
    }

    this.menuEl.innerHTML = html;
    this.menuEl.classList.add('open');
  },

  selectItem(type, id) {
    if (this.menuEl) this.menuEl.classList.remove('open');

    if (type === 'LEAD') {
      App.navigateTo('leads');
      Leads.viewLead(id);
    } else if (type === 'CUSTOMER') {
      App.navigateTo('customers');
      Customers.view360(id);
    } else if (type === 'QUOTE') {
      App.navigateTo('quotes');
      Quotes.viewQuote(id);
    } else if (type === 'PROJECT') {
      App.navigateTo('projects');
      Projects.viewProject(id);
    } else if (type === 'PAYMENT') {
      App.navigateTo('payments');
    }
  }
};

window.GlobalSearch = GlobalSearch;
