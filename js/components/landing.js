// AgroSmart AI - Landing Page Component (Cream, White & Gray Theme)

function renderLandingView() {
  const container = document.getElementById('view-landing');
  if (!container) return;

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-14 px-6 rounded-3xl mb-12 glass-card border border-color bg-card">
      <div class="max-w-4xl mx-auto text-center relative z-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary border border-color text-primary text-xs font-bold mb-6">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
          <span>O'zbekistonda 1-sonli Sun'iy Intellekt Agro-Platformasi</span>
        </div>
        
        <h1 class="text-4xl md:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight" data-i18n="heroHeadline">
          Sun'iy Intellekt Bilan Hosildorlikni 45% ga Oshiring va Suv Tejang
        </h1>
        
        <p class="text-lg md:text-xl text-secondary mb-8 max-w-2xl mx-auto font-normal" data-i18n="heroSubheadline">
          Barg fotosuratidan 1 soniyada ekin kasalligini aniqlang, NPK o'g'it me'yorini hisoblang va bozor narxlari prognozini oling.
        </p>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <button onclick="appRouter.navigate('diagnosis')" class="btn-primary text-base px-8 py-3.5 rounded-xl">
            <i data-lucide="scan-line" class="w-5 h-5"></i>
            <span>Bepul AI Diagnostika</span>
          </button>
          <button onclick="appRouter.navigate('dashboard')" class="btn-secondary text-base px-7 py-3.5 rounded-xl">
            <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
            <span data-i18n="btnTryDemo">Jonli Demoni Sinash</span>
          </button>
        </div>

        <!-- Metric Badges -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-color">
          <div class="text-center">
            <div class="text-3xl font-extrabold text-primary">98.4%</div>
            <div class="text-xs text-muted mt-1">AI Diagnostika Aniqligi</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-extrabold text-primary">1-Soniya</div>
            <div class="text-xs text-muted mt-1">Natija Olish Tezligi</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-extrabold text-primary">38%</div>
            <div class="text-xs text-muted mt-1">Tejalgan Suv Me'yori</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-extrabold text-primary">5,000+</div>
            <div class="text-xs text-muted mt-1">Faol Fermer va Issiqxona</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive ROI & Yield Calculator -->
    <section class="mb-12 glass-card p-8 rounded-2xl border border-color">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-primary mb-2">Interaktiv ROI & Hosildorlik Kalkulyatori</h2>
          <p class="text-secondary">Maydoningiz o'lchami va ekin turini kiriting, AI qancha daromad oshishini hisoblab beradi</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label class="block text-sm font-semibold text-primary mb-2">Ekin Maydoni (Gektar):</label>
            <input type="number" id="roi-area" value="5" min="0.1" step="0.5" oninput="calculateRoi()" class="w-full bg-tertiary border border-color rounded-xl px-4 py-3 text-primary focus:outline-none font-semibold text-lg">
          </div>
          <div>
            <label class="block text-sm font-semibold text-primary mb-2">Ekin Turi:</label>
            <select id="roi-crop" onchange="calculateRoi()" class="w-full bg-tertiary border border-color rounded-xl px-4 py-3 text-primary focus:outline-none font-semibold text-lg">
              <option value="pomidor">Pomidor (Issiqxona)</option>
              <option value="bodring">Bodring (Issiqxona)</option>
              <option value="uzum">Uzumzor (Ochiq maydon)</option>
              <option value="paxta">Paxtachilik</option>
              <option value="olma">Olma bog'i</option>
            </select>
          </div>
        </div>

        <!-- ROI Result Box -->
        <div class="bg-tertiary p-6 rounded-xl border border-color grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div class="text-xs text-muted uppercase tracking-wider mb-1">Kutilayotgan Qo'shimcha Hosil</div>
            <div id="roi-yield" class="text-2xl font-bold text-primary">+18.5 Tonna</div>
          </div>
          <div>
            <div class="text-xs text-muted uppercase tracking-wider mb-1">Qo'shimcha Sof Daromad</div>
            <div id="roi-revenue" class="text-2xl font-bold text-primary">+231.2 mln UZS</div>
          </div>
          <div>
            <div class="text-xs text-muted uppercase tracking-wider mb-1">Tejaladigan Suv Miqdori</div>
            <div id="roi-water" class="text-2xl font-bold text-primary">4,750,000 Litr</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3-Step Process -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-center text-primary mb-8">AgroSmart AI Qanday Ishlaydi?</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-6 rounded-2xl text-center border border-color">
          <div class="w-14 h-14 bg-tertiary rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 font-extrabold text-xl border border-color">1</div>
          <h3 class="text-lg font-bold text-primary mb-2">Barg Rasmini Yuklang</h3>
          <p class="text-sm text-secondary">Kasallangan ekin bargini smartfon kamerasida rasmga olib ilovaga yuklang.</p>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center border border-color">
          <div class="w-14 h-14 bg-tertiary rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 font-extrabold text-xl border border-color">2</div>
          <h3 class="text-lg font-bold text-primary mb-2">AI Diagnostika va Retsept</h3>
          <p class="text-sm text-secondary">Sun'iy intellekt 1 soniyada kasallikni va kerakli organik/kimyoviy dori dozasini chiqarib beradi.</p>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center border border-color">
          <div class="w-14 h-14 bg-tertiary rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 font-extrabold text-xl border border-color">3</div>
          <h3 class="text-lg font-bold text-primary mb-2">Yuqori Hosil va Sotuv</h3>
          <p class="text-sm text-secondary">O'g'it me'yorini to'g'ri bering va AI bozor prognozi orqali mahsulotni eng qimmat narxda soting.</p>
        </div>
      </div>
    </section>
  `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  calculateRoi();
}

function calculateRoi() {
  const areaInput = document.getElementById('roi-area');
  const cropInput = document.getElementById('roi-crop');

  const area = parseFloat(areaInput ? areaInput.value : 5);
  const crop = cropInput ? cropInput.value : 'pomidor';

  const cropRates = {
    pomidor: { yieldPerHa: 35, pricePerKg: 12500, waterPerHa: 950000 },
    bodring: { yieldPerHa: 28, pricePerKg: 7200, waterPerHa: 800000 },
    uzum: { yieldPerHa: 22, pricePerKg: 22000, waterPerHa: 600000 },
    paxta: { yieldPerHa: 4.5, pricePerKg: 11000, waterPerHa: 1200000 },
    olma: { yieldPerHa: 30, pricePerKg: 14000, waterPerHa: 750000 }
  };

  const rate = cropRates[crop] || cropRates.pomidor;
  const extraYieldTons = (area * rate.yieldPerHa * 0.35).toFixed(1);
  const extraRevMln = ((extraYieldTons * 1000 * rate.pricePerKg) / 1000000).toFixed(1);
  const waterSavedLiters = Math.round(area * rate.waterPerHa * 0.38).toLocaleString('uz-UZ');

  if (document.getElementById('roi-yield')) document.getElementById('roi-yield').innerText = `+${extraYieldTons} Tonna`;
  if (document.getElementById('roi-revenue')) document.getElementById('roi-revenue').innerText = `+${extraRevMln} mln UZS`;
  if (document.getElementById('roi-water')) document.getElementById('roi-water').innerText = `${waterSavedLiters} Litr`;
}

window.renderLandingView = renderLandingView;
window.calculateRoi = calculateRoi;
