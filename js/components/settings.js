// AgroSmart AI - Settings Component (Cream/White/Gray Palette & Fail-Safe)

function renderSettingsView() {
  const container = document.getElementById('view-settings');
  if (!container) return;

  const currentTheme = (window.appStore ? window.appStore.get('theme') : 'light') || 'light';
  const currentLang = (window.i18n ? window.i18n.currentLang : 'uz') || 'uz';
  const user = (window.appStore ? window.appStore.get('user') : null) || { name: 'Alisher Qodirov', role: 'Bosh Agronom / Fermer', region: 'Toshkent viloyati', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' };

  container.innerHTML = `
    <!-- Top Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-primary flex items-center gap-3">
        <i data-lucide="settings" class="w-7 h-7 text-primary"></i>
        <span data-i18n="navSettings">Tizim Sozlamalari</span>
      </h1>
      <p class="text-secondary text-sm">Foydalanuvchi profili, til va vizual oq/qaymoqrang interfeys rejimlarini boshqarish</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Profile Card -->
      <div class="glass-card p-6 rounded-2xl border border-color text-center lg:col-span-1">
        <div class="relative w-24 h-24 mx-auto mb-4">
          <img src="${user.avatar}" alt="User Avatar" class="w-full h-full rounded-full object-cover border-2 border-slate-700">
        </div>
        <h3 class="text-xl font-bold text-primary mb-1">${user.name}</h3>
        <p class="text-xs text-secondary font-semibold mb-2">${user.role}</p>
        <span class="badge text-[11px]">${user.region}</span>
      </div>

      <!-- Settings Controls -->
      <div class="glass-card p-6 rounded-2xl border border-color lg:col-span-2 space-y-6">
        <!-- Language Switcher -->
        <div class="flex items-center justify-between pb-4 border-b border-color">
          <div>
            <h4 class="text-base font-bold text-primary mb-1">Interfeys Tili (Language)</h4>
            <p class="text-xs text-secondary">3 ta tilni to'liq qo'llab-quvvatlaydi (UZ, EN, RU)</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="changeLanguage('uz')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${currentLang === 'uz' ? 'btn-primary' : 'bg-tertiary text-primary border border-color'}">
              🇺🇿 O'zbekcha
            </button>
            <button onclick="changeLanguage('en')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${currentLang === 'en' ? 'btn-primary' : 'bg-tertiary text-primary border border-color'}">
              🇬🇧 English
            </button>
            <button onclick="changeLanguage('ru')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${currentLang === 'ru' ? 'btn-primary' : 'bg-tertiary text-primary border border-color'}">
              🇷🇺 Русский
            </button>
          </div>
        </div>

        <!-- Visual Theme Mode Toggle -->
        <div class="flex items-center justify-between pb-4 border-b border-color">
          <div>
            <h4 class="text-base font-bold text-primary mb-1">Vizual Rejim (Theme)</h4>
            <p class="text-xs text-secondary">Oq (Light) yoki Tungi (Dark) rejim</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="toggleTheme('light')" class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentTheme === 'light' ? 'btn-primary' : 'bg-tertiary text-primary border border-color'}">
              <i data-lucide="sun" class="w-4 h-4"></i> Light (Oq Qaymoqrang)
            </button>
            <button onclick="toggleTheme('dark')" class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentTheme === 'dark' ? 'btn-primary' : 'bg-tertiary text-primary border border-color'}">
              <i data-lucide="moon" class="w-4 h-4"></i> Dark (Tungi)
            </button>
          </div>
        </div>

        <!-- Reset Store Data -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <h4 class="text-base font-bold text-primary mb-1">Ma'lumotlarni Qayta Tiklash</h4>
            <p class="text-xs text-secondary">Barcha o'zgarishlarni dastlabki holatga tozalash</p>
          </div>
          <button onclick="handleResetStore()" class="btn-secondary text-xs">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Reset Data
          </button>
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function changeLanguage(lang) {
  if (window.i18n) window.i18n.setLang(lang);
  renderSettingsView();
}

function toggleTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (window.appStore) window.appStore.set('theme', theme);
  renderSettingsView();
  if (window.appRouter && window.appRouter.currentView === 'dashboard') {
    window.renderDashboardView();
  }
}

function handleResetStore() {
  if (confirm('Rostdan ham barcha ma\'lumotlarni qayta tiklamoqchimisiz?')) {
    if (window.appStore) window.appStore.resetStore();
    window.location.reload();
  }
}

window.renderSettingsView = renderSettingsView;
window.changeLanguage = changeLanguage;
window.toggleTheme = toggleTheme;
window.handleResetStore = handleResetStore;
