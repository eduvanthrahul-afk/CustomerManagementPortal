/**
 * Verdant CRM - Main Client Application Orchestrator
 */

const App = {
  currentView: 'dashboard',

  async init() {
    // 1. Authenticate user
    const user = await Auth.init();
    if (!user) return;

    // 2. Initialize Omni Search
    GlobalSearch.init();

    // 3. Setup Routing
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();

    // 4. Global UI event listeners
    this.setupEventListeners();
  },

  handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const [viewName, queryString] = hash.split('?');
    this.navigateTo(viewName || 'dashboard', queryString);
  },

  navigateTo(viewName, queryString = '') {
    this.currentView = viewName;

    // Update Sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => {
      const target = el.getAttribute('data-view');
      if (target === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Toggle View DOM sections
    document.querySelectorAll('.view-section').forEach(el => {
      el.classList.remove('active-view');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active-view');
    }

    // Update Topbar Title and Contextual Action Button
    this.updateTopbar(viewName);

    // Load data for active view
    this.loadViewData(viewName, queryString);

    // Close mobile drawer if open
    // Close mobile drawer if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    // Clear bulk selections on route change
    if (window.DataPortability) {
      DataPortability.clearSelection();
    }
  },

  updateTopbar(viewName) {
    const titleEl = document.getElementById('topbar-page-title');
    const breadcrumbEl = document.getElementById('topbar-breadcrumb');
    const actionBtn = document.getElementById('topbar-primary-action');

    const config = {
      dashboard: {
        title: 'Command Center',
        breadcrumb: 'Overview',
        actionText: '+ New Lead',
        actionFn: () => Leads.openCreateModal()
      },
      analytics: {
        title: 'Growth Trends & Analytics',
        breadcrumb: 'Overview / Analytics',
        actionText: 'Export Reports',
        actionFn: () => Toast.info('Generating analytical intelligence PDF...')
      },
      leads: {
        title: 'Opportunity Pipeline',
        breadcrumb: 'Flow / Leads',
        actionText: '+ New Lead',
        actionFn: () => Leads.openCreateModal()
      },
      surveys: {
        title: 'Site Surveys & Appointments',
        breadcrumb: 'Flow / Site Surveys',
        actionText: '+ Schedule Survey',
        actionFn: () => Surveys.openCreateModal()
      },
      quotes: {
        title: 'Commercial Proposals',
        breadcrumb: 'Flow / Quotes',
        actionText: '+ Create Quote',
        actionFn: () => Quotes.openCreateModal()
      },
      projects: {
        title: 'Projects In-Flight',
        breadcrumb: 'Flow / Projects',
        actionText: '+ Create Project',
        actionFn: () => Projects.openCreateModal()
      },
      payments: {
        title: 'Invoicing & Collections',
        breadcrumb: 'Flow / Payments',
        actionText: '+ Issue Invoice',
        actionFn: () => Payments.openCreateModal()
      },
      customers: {
        title: 'Client Portfolio',
        breadcrumb: 'Aftercare / Customers',
        actionText: '+ Add Customer',
        actionFn: () => Customers.openCreateModal()
      },
      service: {
        title: 'Service & Warranty Support',
        breadcrumb: 'Aftercare / Service & Warranty',
        actionText: '+ Open Ticket',
        actionFn: () => ServiceTickets.openCreateModal()
      }
    };

    const cur = config[viewName] || config.dashboard;
    if (titleEl) titleEl.textContent = cur.title;
    if (breadcrumbEl) breadcrumbEl.textContent = cur.breadcrumb;

    if (actionBtn) {
      actionBtn.textContent = cur.actionText;
      actionBtn.onclick = cur.actionFn;
    }
  },

  loadViewData(viewName, queryString) {
    switch (viewName) {
      case 'dashboard':
        Dashboard.load();
        break;
      case 'analytics':
        Analytics.load('all');
        break;
      case 'leads':
        if (queryString && queryString.includes('status=')) {
          const status = new URLSearchParams(queryString).get('status');
          const select = document.getElementById('leads-filter-status');
          if (select) select.value = status;
          Leads.currentStatus = status;
        }
        Leads.load(0);
        break;
      case 'surveys':
        if (queryString && queryString.includes('status=')) {
          const status = new URLSearchParams(queryString).get('status');
          const select = document.getElementById('surveys-filter-status');
          if (select) select.value = status;
          Surveys.currentStatus = status;
        }
        Surveys.load(0);
        break;
      case 'quotes':
        if (queryString && queryString.includes('status=')) {
          const status = new URLSearchParams(queryString).get('status');
          const select = document.getElementById('quotes-filter-status');
          if (select) select.value = status;
          Quotes.currentStatus = status;
        }
        Quotes.load(0);
        break;
      case 'projects':
        if (queryString && queryString.includes('status=')) {
          const status = new URLSearchParams(queryString).get('status');
          const select = document.getElementById('projects-filter-status');
          if (select) select.value = status;
          Projects.currentStatus = status;
        }
        Projects.load(0);
        break;
      case 'payments':
        if (queryString && queryString.includes('status=')) {
          const status = new URLSearchParams(queryString).get('status');
          const select = document.getElementById('payments-filter-status');
          if (select) select.value = status;
          Payments.currentStatus = status;
        }
        Payments.load(0);
        break;
      case 'customers':
        Customers.load(0);
        break;
      case 'service':
        ServiceTickets.load(0);
        break;
    }
  },

  navigateFromPipeline(stageKey) {
    switch (stageKey) {
      case 'INCOMING': window.location.hash = 'leads?status=NEW'; break;
      case 'ONSITE': window.location.hash = 'surveys?status=SCHEDULED'; break;
      case 'QUOTED': window.location.hash = 'quotes?status=SENT'; break;
      case 'INFLIGHT': window.location.hash = 'projects?status=IN_PROGRESS'; break;
      case 'COLLECTIONS': window.location.hash = 'payments?status=OVERDUE'; break;
    }
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  },

  setupEventListeners() {
    // Mobile sidebar hamburger
    const btnMobile = document.getElementById('btn-mobile-sidebar');
    if (btnMobile) {
      btnMobile.addEventListener('click', () => this.toggleMobileSidebar());
    }

    // Modal forms live calculations
    const quoteAmt = document.getElementById('quote-amount');
    const quoteCost = document.getElementById('quote-cost');
    if (quoteAmt && quoteCost) {
      quoteAmt.addEventListener('input', () => Quotes.calculateMarginInForm());
      quoteCost.addEventListener('input', () => Quotes.calculateMarginInForm());
    }
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
