/**
 * analytics.js — Analytics Dashboard
 * Fetches aggregated data and renders Chart.js charts + KPI cards.
 */

let chartsInitialized = false;
let chartInstances = {};

const CHART_COLORS = {
  amber:    'rgba(245, 158, 11, 0.85)',
  teal:     'rgba(20, 184, 166, 0.85)',
  purple:   'rgba(139, 92, 246, 0.85)',
  blue:     'rgba(59, 130, 246, 0.85)',
  rose:     'rgba(244, 63, 94, 0.85)',
  green:    'rgba(34, 197, 94, 0.85)',
  amberFade: 'rgba(245, 158, 11, 0.15)',
};

const TONE_COLORS = {
  Adventurous: 'rgba(245, 158, 11, 0.85)',
  Poetic:      'rgba(236, 72, 153, 0.85)',
  Informative: 'rgba(59, 130, 246, 0.85)',
  Humorous:    'rgba(34, 197, 94, 0.85)',
};

async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/analytics`);
    const data = await res.json();

    // ── KPI Cards ──────────────────────────────────────────
    document.getElementById('kpiTotal').textContent = data.kpis.total;
    document.getElementById('kpiRating').textContent =
      data.kpis.avgRating ? `${data.kpis.avgRating} ★` : '—';
    document.getElementById('kpiTopTone').textContent =
      data.toneDistribution[0]?.tone || '—';
    document.getElementById('kpiRated').textContent = data.kpis.ratedCount;

    // ── Destroy old charts before recreating ──────────────
    Object.values(chartInstances).forEach((c) => c.destroy());
    chartInstances = {};

    // ── Shared Chart Defaults ──────────────────────────────
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // ── Per-Day Line Chart ─────────────────────────────────
    const perDayCtx = document.getElementById('chartPerDay').getContext('2d');
    // Fill in missing days with 0
    const allDays = getLast30Days();
    const dayMap = Object.fromEntries(data.perDay.map((d) => [d.day, d.count]));
    const perDayCounts = allDays.map((d) => dayMap[d] || 0);

    chartInstances.perDay = new Chart(perDayCtx, {
      type: 'line',
      data: {
        labels: allDays.map((d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
        datasets: [{
          label: 'Narratives Generated',
          data: perDayCounts,
          borderColor: CHART_COLORS.amber,
          backgroundColor: CHART_COLORS.amberFade,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.amber,
          pointRadius: 3,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 8 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    // ── Tone Doughnut ─────────────────────────────────────
    const toneCtx = document.getElementById('chartTone').getContext('2d');
    chartInstances.tone = new Chart(toneCtx, {
      type: 'doughnut',
      data: {
        labels: data.toneDistribution.map((t) => t.tone),
        datasets: [{
          data: data.toneDistribution.map((t) => t.count),
          backgroundColor: data.toneDistribution.map((t) => TONE_COLORS[t.tone] || CHART_COLORS.blue),
          borderColor: 'transparent',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' } },
        },
        cutout: '65%',
      },
    });

    // ── Rating Bar Chart ──────────────────────────────────
    const ratingsCtx = document.getElementById('chartRatings').getContext('2d');
    const ratingLabels = ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'];
    const ratingMap = Object.fromEntries(data.ratingDist.map((r) => [r.rating, r.count]));
    chartInstances.ratings = new Chart(ratingsCtx, {
      type: 'bar',
      data: {
        labels: ratingLabels,
        datasets: [{
          label: 'Count',
          data: [1, 2, 3, 4, 5].map((r) => ratingMap[r] || 0),
          backgroundColor: [
            CHART_COLORS.rose, CHART_COLORS.purple, CHART_COLORS.blue,
            CHART_COLORS.teal, CHART_COLORS.amber,
          ],
          borderColor: 'transparent',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    // ── Top Routes Horizontal Bar ─────────────────────────
    const routesCtx = document.getElementById('chartRoutes').getContext('2d');
    chartInstances.routes = new Chart(routesCtx, {
      type: 'bar',
      data: {
        labels: data.topRoutes.map((r) => truncate(r.route, 22)),
        datasets: [{
          label: 'Trips',
          data: data.topRoutes.map((r) => r.count),
          backgroundColor: CHART_COLORS.teal,
          borderColor: 'transparent',
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } },
          y: { grid: { display: false } },
        },
      },
    });

    // ── Top Drivers Horizontal Bar ────────────────────────
    const driversCtx = document.getElementById('chartDrivers').getContext('2d');
    chartInstances.drivers = new Chart(driversCtx, {
      type: 'bar',
      data: {
        labels: data.topDrivers.map((d) => truncate(d.driver_name, 18)),
        datasets: [{
          label: 'Stories',
          data: data.topDrivers.map((d) => d.count),
          backgroundColor: CHART_COLORS.purple,
          borderColor: 'transparent',
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } },
          y: { grid: { display: false } },
        },
      },
    });

    // ── High Rated Table ──────────────────────────────────
    const highRatedContainer = document.getElementById('highRatedTable');
    if (data.recentHighRated.length === 0) {
      highRatedContainer.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:14px;">No high-rated narratives yet. Generate and rate some stories!</p>';
    } else {
      highRatedContainer.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Driver / Staff</th>
              <th>Route</th>
              <th>Rating</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.recentHighRated.map((r) => `
              <tr>
                <td style="color:var(--text-muted)">${r.id}</td>
                <td class="truncate-cell">${escapeHtml(r.title || r.route)}</td>
                <td>${escapeHtml(r.driver_name)}</td>
                <td class="truncate-cell">${escapeHtml(r.route)}</td>
                <td class="rating-stars">${'★'.repeat(r.rating)}</td>
                <td style="color:var(--text-muted);font-size:12px;">${new Date(r.created_at).toLocaleDateString('en-IN')}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

  } catch (err) {
    console.error('Analytics load error:', err);
    showToast('Failed to load analytics. Is the backend running?', 'error');
  }
}

// ── Helpers ────────────────────────────────────────────────
function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
