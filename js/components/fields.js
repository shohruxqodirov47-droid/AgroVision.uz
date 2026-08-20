// AgroSmart AI - Fields & Greenhouses Component (Fail-Safe & Cream/White Palette)

function renderFieldsView() {
  const container = document.getElementById('view-fields');
  if (!container) return;

  const fields = (window.appStore ? window.appStore.get('fields') : null) || [];

  container.innerHTML = `
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary flex items-center gap-3">
          <i data-lucide="map-pin" class="w-7 h-7 text-primary"></i>
          <span data-i18n="fieldsTitle">Maydonlar va Issiqxonalar</span>
        </h1>
        <p class="text-secondary text-sm">Fermer xo'jaligingizga tegishli ekin maydonlari va sensor nazorati</p>
      </div>

      <button onclick="openAddFieldModal()" class="btn-primary">
        <i data-lucide="plus" class="w-4 h-4"></i>
        <span data-i18n="btnAddField">Yangi Maydon Qo'shish</span>
      </button>
    </div>

    <!-- Fields Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      ${fields.map(f => `
        <div class="glass-card p-6 rounded-2xl border border-color hover:border-slate-400 transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="badge">
                <i data-lucide="${f.type === 'greenhouse' ? 'home' : 'sprout'}" class="w-3.5 h-3.5"></i>
                <span>${f.type === 'greenhouse' ? 'Issiqxona' : 'Ochiq Maydon'}</span>
              </span>
              <span class="text-xs text-secondary font-mono">${f.area} Gektar</span>
            </div>

            <h3 class="text-xl font-bold text-primary mb-1">${f.name}</h3>
            <div class="text-sm font-semibold text-secondary mb-4">${f.crop}</div>

            <!-- Sensors & Metrics -->
            <div class="space-y-3 mb-6 bg-tertiary p-4 rounded-xl border border-color">
              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="text-primary flex items-center gap-1">
                    <i data-lucide="droplets" class="w-3.5 h-3.5"></i> Tuproq Namligi
                  </span>
                  <span class="text-primary font-bold">${f.soilMoisture}%</span>
                </div>
                <div class="w-full bg-card rounded-full h-2 overflow-hidden border border-color">
                  <div class="bg-slate-700 h-full rounded-full" style="width: ${f.soilMoisture}%"></div>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="text-primary flex items-center gap-1">
                  <i data-lucide="thermometer" class="w-3.5 h-3.5"></i> Harorat
                </span>
                <span class="text-primary font-bold">${f.temp}°C</span>
              </div>

              <div class="pt-2 border-t border-color">
                <div class="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">NPK Balansi (mg/kg)</div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div class="bg-card p-1.5 rounded text-primary border border-color">N: ${f.npk.n}</div>
                  <div class="bg-card p-1.5 rounded text-primary border border-color">P: ${f.npk.p}</div>
                  <div class="bg-card p-1.5 rounded text-primary border border-color">K: ${f.npk.k}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-color text-xs text-secondary">
            <span>Diagnostika: ${f.lastDiagnosis}</span>
            <button onclick="appRouter.navigate('diagnosis')" class="text-primary font-bold hover:underline">AI Tekshirish &rarr;</button>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Modal for Adding Field -->
    <div id="modal-add-field" class="modal-overlay">
      <div class="modal-container p-6">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-color">
          <h3 class="text-xl font-bold text-primary">Yangi Ekin Maydoni Qo'shish</h3>
          <button onclick="closeAddFieldModal()" class="text-secondary hover:text-primary">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleAddFieldSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-primary mb-1">Maydon/Issiqxona Nomi:</label>
            <input type="text" id="new-field-name" required placeholder="Masalan: Zangiota Issiqxonasi #2" class="w-full bg-tertiary border border-color rounded-xl px-4 py-2.5 text-primary focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-primary mb-1">Maydon Turi:</label>
              <select id="new-field-type" class="w-full bg-tertiary border border-color rounded-xl px-4 py-2.5 text-primary focus:outline-none">
                <option value="greenhouse">Issiqxona (Greenhouse)</option>
                <option value="field">Ochiq Maydon (Open Field)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-primary mb-1">Ekin Turi:</label>
              <input type="text" id="new-field-crop" required placeholder="Masalan: Pomidor (Izmir F1)" class="w-full bg-tertiary border border-color rounded-xl px-4 py-2.5 text-primary focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-primary mb-1">Maydon O'lchami (Gektar):</label>
              <input type="number" step="0.1" id="new-field-area" required placeholder="2.5" class="w-full bg-tertiary border border-color rounded-xl px-4 py-2.5 text-primary focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-semibold text-primary mb-1">Ekilgan Sana:</label>
              <input type="date" id="new-field-date" required class="w-full bg-tertiary border border-color rounded-xl px-4 py-2.5 text-primary focus:outline-none">
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-color">
            <button type="button" onclick="closeAddFieldModal()" class="btn-secondary">Bekor Qilish</button>
            <button type="submit" class="btn-primary">Saqlash va Qo'shish</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function openAddFieldModal() {
  const modal = document.getElementById('modal-add-field');
  if (modal) modal.classList.add('active');
}

function closeAddFieldModal() {
  const modal = document.getElementById('modal-add-field');
  if (modal) modal.classList.remove('active');
}

function handleAddFieldSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-field-name')?.value;
  const type = document.getElementById('new-field-type')?.value;
  const crop = document.getElementById('new-field-crop')?.value;
  const area = parseFloat(document.getElementById('new-field-area')?.value || 1);

  if (name && crop && window.appStore) {
    window.appStore.addField({ name, type, crop, area });
    closeAddFieldModal();
    renderFieldsView();
  }
}

window.renderFieldsView = renderFieldsView;
window.openAddFieldModal = openAddFieldModal;
window.closeAddFieldModal = closeAddFieldModal;
window.handleAddFieldSubmit = handleAddFieldSubmit;
