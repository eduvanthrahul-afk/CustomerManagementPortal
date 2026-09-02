/**
 * Verdant CRM - Growth Trends & Business Intelligence Analytics Engine
 * Powered by Chart.js with Custom Editorial Styling Tokens
 */

const Analytics = {
  currentTimeframe: 'all',
  charts: {},
  data: null,

  async load(timeframe = 'all') {
    this.currentTimeframe = timeframe;
    this.updateTimeframePills();

    try {
      const response = await API.get('/analytics/overview', { timeframe });
      this.data = response;
      this.renderKPIs(response.kpis);
      this.renderRevenueTrendChart(response.revenueTrends);
      this.renderFunnelStages(response.funnelStages);
      this.renderWinLossChart(response.winLossStats);
      this.renderAgingBuckets(response.agingBuckets);
      this.renderMarginHealthChart(response.marginTrends);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      Toast.error('Could not load analytics intelligence. Please try again.');
    }
  },

  updateTimeframePills() {
    document.querySelectorAll('.timeframe-pill').forEach(btn => {
      const tf = btn.getAttribute('data-timeframe');
      if (tf === this.currentTimeframe) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  setTimeframe(tf) {
    this.load(tf);
  },

  renderKPIs(kpis) {
    if (!kpis) return;

    const fmt = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

    const elPipeline = document.getElementById('kpi-gross-pipeline');
    if (elPipeline) elPipeline.textContent = fmt(kpis.totalGrossPipeline);

    const elRealized = document.getElementById('kpi-revenue-realized');
    if (elRealized) elRealized.textContent = fmt(kpis.monthlyRevenueRealized);

    const elWinRate = document.getElementById('kpi-win-rate');
    if (elWinRate) elWinRate.textContent = `${kpis.winRatePercentage}%`;

    const elVelocity = document.getElementById('kpi-deal-velocity');
    if (elVelocity) elVelocity.textContent = `${kpis.averageDealVelocityDays} Days`;
  },

  renderRevenueTrendChart(trends) {
    const ctx = document.getElementById('canvas-revenue-trends');
    if (!ctx) return;

    if (this.charts.revenueTrends) {
      this.charts.revenueTrends.destroy();
    }

    const labels = trends.map(t => t.monthLabel);
    const invoicedData = trends.map(t => Number(t.invoicedAmount));
    const collectedData = trends.map(t => Number(t.collectedAmount));
    const trendlineData = trends.map(t => Number(t.trendlineValue));

    this.charts.revenueTrends = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Growth Trendline (Linear Reg)',
            data: trendlineData,
            borderColor: '#c55a38', // Terracotta
            borderWidth: 2.5,
            borderDash: [5, 5],
            pointRadius: 3,
            pointBackgroundColor: '#c55a38',
            tension: 0.1,
            order: 1
          },
          {
            type: 'line',
            label: 'Cash Collected ($)',
            data: collectedData,
            borderColor: '#2c593f', // Forest Green
            backgroundColor: 'rgba(44, 89, 63, 0.08)',
            fill: true,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#2c593f',
            tension: 0.35,
            order: 2
          },
          {
            type: 'bar',
            label: 'Invoiced Billings ($)',
            data: invoicedData,
            backgroundColor: 'rgba(203, 146, 41, 0.45)', // Sun Honey
            borderColor: '#cb9229',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.55,
            order: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141e18',
            titleFont: { family: 'Plus Jakarta Sans', size: 12 },
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ₹${Number(context.raw).toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#6e7972' }
          },
          y: {
            grid: { color: '#f0ebe2' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              color: '#6e7972',
              callback: val => `₹${val >= 1000 ? (val / 1000) + 'k' : val}`
            }
          }
        }
      }
    });
  },

  renderFunnelStages(stages) {
    const container = document.getElementById('funnel-stages-container');
    if (!container || !stages) return;

    container.innerHTML = stages.map((st, idx) => `
      <div class="funnel-step-card">
        <div class="funnel-step-meta">
          <span class="funnel-step-name">${st.stageName}</span>
          <span class="funnel-step-counts">${st.count} deals ($${Number(st.totalValue).toLocaleString()})</span>
        </div>
        <div class="funnel-bar-track">
          <div class="funnel-bar-fill" style="width: ${st.overallConversionRate}%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">
          <span>${idx === 0 ? 'Baseline' : `Step Conv: ${st.conversionRateFromPrevious}%`}</span>
          <span class="funnel-step-rate">${st.overallConversionRate}% Overall</span>
        </div>
      </div>
    `).join('');
  },

  renderWinLossChart(winLoss) {
    const ctx = document.getElementById('canvas-win-loss');
    if (!ctx || !winLoss) return;

    if (this.charts.winLoss) {
      this.charts.winLoss.destroy();
    }

    this.charts.winLoss = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Deals Won', 'Deals Lost'],
        datasets: [{
          data: [winLoss.wonCount, winLoss.lostCount],
          backgroundColor: ['#2c593f', '#c55a38'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Plus Jakarta Sans', size: 12 },
              padding: 16,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: '#141e18',
            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} deals (${Math.round(ctx.raw / winLoss.totalDealsClosed * 100)}%)`
            }
          }
        }
      }
    });

    // Render Loss Reasons Breakdown
    const reasonsContainer = document.getElementById('loss-reasons-container');
    if (reasonsContainer && winLoss.topLossReasons) {
      reasonsContainer.innerHTML = winLoss.topLossReasons.map(r => `
        <div class="loss-reason-item">
          <span class="loss-reason-label">${r.reason}</span>
          <span class="loss-reason-pill">${r.count} lost (${r.percentage}%)</span>
        </div>
      `).join('');
    }
  },

  renderAgingBuckets(buckets) {
    const container = document.getElementById('aging-buckets-cards-container');
    if (container && buckets) {
      container.innerHTML = buckets.map(b => `
        <div class="aging-bucket-box ${b.severity}">
          <span class="bucket-name">${b.bucketName}</span>
          <span class="bucket-amount">$${Number(b.totalAmount).toLocaleString()}</span>
          <span class="bucket-count">${b.invoiceCount} invoices (${b.percentageOfTotal}%)</span>
        </div>
      `).join('');
    }

    const ctx = document.getElementById('canvas-aging-chart');
    if (!ctx || !buckets) return;

    if (this.charts.agingChart) {
      this.charts.agingChart.destroy();
    }

    const labels = buckets.map(b => b.bucketName.split(' ')[0]);
    const amounts = buckets.map(b => Number(b.totalAmount));

    this.charts.agingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Overdue Amount ($)',
          data: amounts,
          backgroundColor: ['#2c593f', '#cb9229', '#c55a38', '#be3a3a'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141e18',
            callbacks: {
              label: ctx => ` Outstanding: $${Number(ctx.raw).toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } } },
          y: {
            grid: { color: '#f0ebe2' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              callback: val => `$${val >= 1000 ? (val / 1000) + 'k' : val}`
            }
          }
        }
      }
    });
  },

  renderMarginHealthChart(trends) {
    const ctx = document.getElementById('canvas-margin-health');
    if (!ctx || !trends) return;

    if (this.charts.marginHealth) {
      this.charts.marginHealth.destroy();
    }

    const labels = trends.map(t => t.periodLabel);
    const margins = trends.map(t => t.averageMarginPercent);
    const targets = trends.map(t => t.targetMarginPercent);

    this.charts.marginHealth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Margin %',
            data: margins,
            borderColor: '#2c593f',
            backgroundColor: 'rgba(44, 89, 63, 0.1)',
            fill: true,
            borderWidth: 2.5,
            pointRadius: 4,
            tension: 0.3
          },
          {
            label: 'Target Baseline (25%)',
            data: targets,
            borderColor: '#cb9229',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Plus Jakarta Sans', size: 11 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#141e18',
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: '#f0ebe2' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              callback: val => `${val}%`
            },
            min: 15,
            max: 35
          }
        }
      }
    });
  }
};

window.Analytics = Analytics;
