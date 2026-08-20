// AgroSmart AI - Dashboard Component (Cream, White & Gray Theme - Fail-Safe)

let moistureChartInstance = null;
let yieldChartInstance = null;

function renderDashboardView() {
  const container = document.getElementById('view-dashboard');
  if (!container) return;

  const stats = (window.appStore ? window.appStore.get('stats') : null) || { totalAreaHectares: 18.5, healthScore: 92, waterSavedPercent: 38, activeAlerts: 2 };
  const fields = (window.appStore ? window.appStore.get('fields') : null) || [];

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary flex items-center gap-3">
          <span>Agro Dashboard & Monitoring</span>
          <span class="badge text-xs font-semibold">Real-Time Sync</span>
        </h1>
        <p class="text-secondary text-sm">Fermer xo'jaligi ko'rsatkichlari, tuproq namligi va ekin salomatligi analitikasi</p>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="appRouter.navigate('diagnosis')" class="btn-primary">
          <i data-lucide="scan-line" class="w-4 h-4"></i>
          <span>Yangi AI Diagnostika</span>
        </button>
        <button onclick="openAddFieldModal()" class="btn-secondary">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Maydon Qo'shish</span>
        </button>
      </div>
    </div>

    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="glass-card p-6 rounded-2xl border border-color">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-muted uppercase tracking-wider">Umumiy Ekin Maydoni</span>
          <div class="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-primary">
            <i data-lucide="map" class="w-5 h-5"></i>
          </div>
        </div>
        <div class="text-3xl font-extrabold text-primary mb-1">${stats.totalAreaHectares} Ha</div>
        <div class="text-xs text-secondary font-semibold">3 ta maydon va issiqxonalar</div>
      </div>

      <div class="glass-card p-6 rounded-2xl border border-color">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-muted uppercase tracking-wider">Salomatlik Indeksi</span>
          <div class="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-primary">
            <i data-lucide="activity" class="w-5 h-5"></i>
          </div>
        </div>
        <div class="text-3xl font-extrabold text-primary mb-1">${stats.healthScore}%</div>
        <div class="text-xs text-secondary">Optimal oziqlantirish rejimi</div>
      </div>

      <div class="glass-card p-6 rounded-2xl border border-color">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-muted uppercase tracking-wider">Tejalgan Suv Me'yori</span>
          <div class="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-primary">
            <i data-lucide="droplets" class="w-5 h-5"></i>
          </div>
        </div>
        <div class="text-3xl font-extrabold text-primary mb-1">${stats.waterSavedPercent}%</div>
        <div class="text-xs text-secondary">Tomchilatib sug'orish nazorati</div>
      </div>

      <div class="glass-card p-6 rounded-2xl border border-color">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-muted uppercase tracking-wider">Xavf Ogohlantirishlari</span>
          <div class="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-primary">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i>
          </div>
        </div>
        <div class="text-3xl font-extrabold text-primary mb-1">${stats.activeAlerts} ta</div>
        <div class="text-xs text-secondary">Zudlik bilan choralar zarur</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="glass-card p-6 rounded-2xl border border-color">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-primary flex items-center gap-2">
            <i data-lucide="thermometer-snowflake" class="w-5 h-5 text-primary"></i>
            <span>Tuproq Namligi va Harorat Dinamikasi</span>
          </h2>
          <span class="text-xs text-muted">Oxirgi 7 kun</span>
        </div>
        <div class="h-64 relative">
          <canvas id="chart-moisture"></canvas>
        </div>
      </div>

      <div class="glass-card p-6 rounded-2xl border border-color">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-primary flex items-center gap-2">
            <i data-lucide="bar-chart-3" class="w-5 h-5 text-primary"></i>
            <span>Hosil Prognozi (Tonna / Gektar)</span>
          </h2>
          <span class="text-xs text-muted">AI Prognozi</span>
        </div>
        <div class="h-64 relative">
          <canvas id="chart-yield"></canvas>
        </div>
      </div>
    </div>

    <!-- Fields Table -->
    <div class="glass-card p-6 rounded-2xl border border-color">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-primary flex items-center gap-2">
          <i data-lucide="sprout" class="w-5 h-5 text-primary"></i>
          <span>Maydonlar va Issiqxonalar Holati</span>
        </h3>
        <button onclick="appRouter.navigate('fields')" class="text-xs text-primary font-semibold hover:underline">Barchasini ko'rish &rarr;</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-color text-muted text-xs font-bold uppercase">
              <th class="py-3 px-3">Maydon Nomi</th>
              <th class="py-3 px-3">Ekin Turi</th>
              <th class="py-3 px-3">Maydoni</th>
              <th class="py-3 px-3">Namlik</th>
              <th class="py-3 px-3">Harorat</th>
              <th class="py-3 px-3">Holati</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-color">
            ${fields.map(f => `
              <tr class="hover:bg-tertiary transition-colors">
                <td class="py-3 px-3 font-semibold text-primary">${f.name}</td>
                <td class="py-3 px-3 text-secondary">${f.crop}</td>
                <td class="py-3 px-3 text-primary font-bold">${f.area} Ha</td>
                <td class="py-3 px-3 font-semibold text-primary">${f.soilMoisture}%</td>
                <td class="py-3 px-3 text-primary font-semibold">${f.temp}°C</td>
                <td class="py-3 px-3">
                  <span class="badge">Optimal</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  initDashboardCharts();
}

function initDashboardCharts() {
  if (typeof Chart === 'undefined') return;

  const moistureCanvas = document.getElementById('chart-moisture');
  const yieldCanvas = document.getElementById('chart-yield');

  if (moistureCanvas) {
    if (moistureChartInstance) moistureChartInstance.destroy();
    moistureChartInstance = new Chart(moistureCanvas, {
      type: 'line',
      data: {
        labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
        datasets: [
          {
            label: 'Tuproq Namligi (%)',
            data: [68, 65, 72, 70, 62, 58, 65],
            borderColor: '#334155',
            backgroundColor: 'rgba(51, 65, 85, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#334155' } } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      }
    });
  }

  if (yieldCanvas) {
    if (yieldChartInstance) yieldChartInstance.destroy();
    yieldChartInstance = new Chart(yieldCanvas, {
      type: 'bar',
      data: {
        labels: ['Pomidor', 'Bodring', 'Uzum', 'Paxta', 'Olma'],
        datasets: [
          {
            label: 'AgroSmart AI Bilan (T/Ha)',
            data: [35, 28, 22, 4.5, 30],
            backgroundColor: '#334155',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#334155' } } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      }
    });
  }
}

window.renderDashboardView = renderDashboardView;
