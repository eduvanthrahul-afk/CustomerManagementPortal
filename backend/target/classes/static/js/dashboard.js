/**
 * Command Center Dashboard Module
 */

const Dashboard = {
  async load() {
    try {
      const data = await API.get('/dashboard/overview');
      this.renderHero(data.revenueRisk);
      this.renderPipeline(data.pipeline);
      this.renderDecisions(data.decisionsNeeded);
      this.renderMovement(data.movementToday);
      this.renderSchedule(data.onTheGround);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      Toast.error('Could not load dashboard data from database');
    }
  },

  formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);
  },

  renderHero(risk) {
    if (!risk) return;
    const heroAmt = document.getElementById('dash-hero-amount');
    if (heroAmt) heroAmt.textContent = this.formatCurrency(risk.totalAtRisk);

    const unfollowedCount = document.getElementById('metric-unfollowed-quotes');
    if (unfollowedCount) unfollowedCount.textContent = risk.unfollowedQuotesCount;

    const unfollowedAmt = document.getElementById('metric-unfollowed-amount');
    if (unfollowedAmt) unfollowedAmt.textContent = this.formatCurrency(risk.unfollowedQuotesAmount);

    const uncontactedLeads = document.getElementById('metric-uncontacted-leads');
    if (uncontactedLeads) uncontactedLeads.textContent = risk.leadsNotContactedCount;

    const overdueCount = document.getElementById('metric-overdue-payments');
    if (overdueCount) overdueCount.textContent = risk.overduePaymentsCount;

    const overdueAmt = document.getElementById('metric-overdue-amount');
    if (overdueAmt) overdueAmt.textContent = this.formatCurrency(risk.overduePaymentsAmount);

    const delayedCount = document.getElementById('metric-delayed-projects');
    if (delayedCount) delayedCount.textContent = risk.delayedProjectsCount;

    const delayedAmt = document.getElementById('metric-delayed-amount');
    if (delayedAmt) delayedAmt.textContent = this.formatCurrency(risk.delayedProjectsBudget);

    const lowMarginCount = document.getElementById('metric-low-margin');
    if (lowMarginCount) lowMarginCount.textContent = risk.lowMarginQuotesCount;
  },

  renderPipeline(pipeline) {
    const container = document.getElementById('dash-pipeline-steps');
    if (!container || !pipeline) return;

    container.innerHTML = pipeline.map((stage, idx) => `
      <div class="pipeline-step-item" onclick="App.navigateFromPipeline('${stage.stageKey}')">
        <div class="step-circle">${stage.count}</div>
        <div class="step-name">${stage.label}</div>
        <div class="step-count-pill">${stage.count} ${stage.count === 1 ? 'item' : 'items'}</div>
      </div>
    `).join('');
  },

  renderDecisions(decisions) {
    const container = document.getElementById('dash-decisions-list');
    if (!container) return;

    if (!decisions || decisions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem;">
          <div class="empty-state-icon" style="width: 36px; height: 36px; margin-bottom: 0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div style="font-size: 0.88rem; font-weight: 600;">All caught up</div>
          <div style="font-size: 0.78rem; color: var(--muted);">No urgent decisions pending at this moment.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = decisions.map(d => `
      <div class="decision-item-box">
        <div class="decision-top-meta">
          <span class="decision-title">${d.title}</span>
          <span class="badge badge-${d.badgeType}">
            <span class="badge-dot"></span>${d.status}
          </span>
        </div>
        <div class="decision-reason-text">${d.reason}</div>
        <div class="decision-actions-row">
          <div class="decision-amount">${d.amount ? this.formatCurrency(d.amount) : ''}</div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-primary" onclick="Dashboard.handleDecisionAction('${d.recordType}', ${d.recordId}, '${d.primaryAction}')">
              ${d.primaryAction}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  handleDecisionAction(type, id, action) {
    if (type === 'PAYMENT') {
      Payments.openMarkPaidModal(id);
    } else if (type === 'QUOTE') {
      Quotes.viewQuote(id);
    } else if (type === 'PROJECT') {
      Projects.viewProject(id);
    } else if (type === 'LEAD') {
      Leads.viewLead(id);
    }
  },

  renderMovement(activities) {
    const container = document.getElementById('dash-movement-timeline');
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = `<div class="text-muted" style="font-size: 0.82rem; padding: 1rem 0;">No movement logged yet today.</div>`;
      return;
    }

    container.innerHTML = activities.map(a => {
      const timeAgo = this.formatTimeAgo(a.createdAt);
      return `
        <div class="movement-item">
          <div class="movement-icon-box">
            ${this.getActivityIcon(a.icon)}
          </div>
          <div class="movement-details">
            <div class="movement-title">${a.title}</div>
            <div class="movement-desc">${a.description || ''}</div>
            <div class="movement-time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderSchedule(schedule) {
    const container = document.getElementById('dash-schedule-list');
    if (!container) return;

    if (!schedule || schedule.length === 0) {
      container.innerHTML = `<div class="text-muted" style="font-size: 0.82rem; padding: 1rem 0;">No on-site appointments scheduled.</div>`;
      return;
    }

    container.innerHTML = schedule.map(s => `
      <div class="schedule-row-card">
        <div class="schedule-customer-time">
          <div class="schedule-time-badge">${s.time}</div>
          <div class="schedule-name-location">
            <div class="schedule-name">${s.customerName}</div>
            <div class="schedule-location">${s.location}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span style="font-size: 0.78rem; color: var(--muted); font-family: var(--font-mono);">${s.assignedStaffName}</span>
          <span class="badge ${s.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}">
            <span class="badge-dot"></span>${s.status}
          </span>
        </div>
      </div>
    `).join('');
  },

  getActivityIcon(icon) {
    switch (icon) {
      case 'check-circle': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c593f" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      case 'alert-triangle': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c55a38" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      case 'credit-card':
      case 'dollar-sign': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c593f" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';
      case 'sparkles':
      case 'user-plus': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c593f" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7.5" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
      case 'clock': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cb9229" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      default: return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d6a87" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
  },

  formatTimeAgo(dateStr) {
    if (!dateStr) return 'recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  }
};

window.Dashboard = Dashboard;
