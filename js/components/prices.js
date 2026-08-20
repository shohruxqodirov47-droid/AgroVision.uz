// AgroSmart AI - Crop Market Prices Component (Fail-Safe & Cream/White Palette)

let pricesChartInstance = null;

function renderPricesView() {
  const container = document.getElementById('view-prices');
  if (!container) return;

  const prices = (window.appStore ? window.appStore.get('marketPrices') : null) || [];

  container.innerHTML = `
    <!-- Top Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-primary flex items-center gap-3">
        <i data-lucide="trending-up" class="w-7 h-7 text-primary"></i>
        <span data-i18n="pricesTitle">Bozor Narxlari va AI Prognozi</span>
      </h1>
      <p class="text-secondary text-sm" data-i18n="pricesSubtitle">O'zbekiston ulgurji bozorlaridagi joriy va kutilayotgan ekin narxlari hamda AI sotuv strategiyasi</p>
    </div>

    <!-- Chart -->
    <div class="glass-card p-6 rounded-2xl border border-color mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-primary flex items-center gap-2">
          <i data-lucide="line-chart" class="w-5 h-5 text-primary"></i>
          <span>Ulgurji Narxlar AI Prognozi (So'm / kg)</span>
        </h2>
        <span class="badge text-xs">AI Trend Analyst</span>
      </div>
      <div class="h-64 relative">
        <canvas id="chart-prices-trend"></canvas>
      </div>
    </div>

    <!-- Prices Data Table -->
    <div class="glass-card p-6 rounded-2xl border border-color">
      <h3 class="text-lg font-bold text-primary mb-4 flex items-center gap-2">
        <i data-lucide="shopping-bag" class="w-5 h-5 text-primary"></i>
        <span>Ekinlar Bo'yicha Narxlar Tahlili va AI Maslahati</span>
      </h3>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-color text-muted text-xs font-bold uppercase">
              <th class="py-3 px-4" data-i18n="cropCol">Ekin Turi</th>
              <th class="py-3 px-4" data-i18n="currentPriceCol">Bugungi Narx</th>
              <th class="py-3 px-4" data-i18n="trendCol">Dinamika</th>
              <th class="py-3 px-4" data-i18n="forecastCol">Kelgusi Oy Prognozi</th>
              <th class="py-3 px-4" data-i18n="aiAdviceCol">AI Sotuv Tavsiyasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-color">
            ${prices.map(p => `
              <tr class="hover:bg-tertiary transition-colors">
                <td class="py-4 px-4 font-bold text-primary flex items-center gap-2">
                  <i data-lucide="sprout" class="w-4 h-4 text-primary"></i>
                  <span>${p.crop}</span>
                </td>
                <td class="py-4 px-4 font-mono font-bold text-primary">
                  ${p.currentPrice.toLocaleString('uz-UZ')} UZS / ${p.unit}
                </td>
                <td class="py-4 px-4">
                  <span class="badge font-bold">
                    ${p.change}
                  </span>
                </td>
                <td class="py-4 px-4 font-mono font-bold text-primary">
                  ${p.forecastNextMonth.toLocaleString('uz-UZ')} UZS
                </td>
                <td class="py-4 px-4 text-xs text-secondary max-w-xs">
                  <div class="p-2.5 rounded-lg bg-tertiary border border-color">
                    ${p.advice}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  initPricesChart();
}

function initPricesChart() {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('chart-prices-trend');
  if (!canvas) return;

  if (pricesChartInstance) pricesChartInstance.destroy();
  pricesChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Iyun', 'Iyul', 'Avgust (Hozir)', 'Sentyabr (AI)', 'Oktyabr (AI)', 'Noyabr (AI)'],
      datasets: [
        {
          label: 'Pomidor (UZS/kg)',
          data: [9000, 10500, 12500, 15500, 18000, 21000],
          borderColor: '#0f172a',
          tension: 0.3
        },
        {
          label: 'Uzum Husayni (UZS/kg)',
          data: [15000, 18000, 22000, 28000, 32000, 35000],
          borderColor: '#334155',
          tension: 0.3
        },
        {
          label: 'Bodring (UZS/kg)',
          data: [12000, 9000, 7200, 6500, 8500, 14000],
          borderColor: '#64748b',
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

window.renderPricesView = renderPricesView;
