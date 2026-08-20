// AgroSmart AI - Master Controller & Router (100% Robust & Fail-Safe)

class AppRouter {
  constructor() {
    this.currentView = 'landing';
  }

  init() {
    // Load theme & language preferences
    const savedTheme = (window.appStore ? window.appStore.get('theme') : 'light') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (window.i18n) window.i18n.updateDOM();

    // Bind hash change
    window.addEventListener('hashchange', () => this.handleHashChange());
    
    // Initial routing
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'landing';
    this.navigate(hash, false);
  }

  navigate(viewName, updateHash = true) {
    const validViews = ['landing', 'dashboard', 'diagnosis', 'fields', 'prices', 'copilot', 'settings'];
    if (!validViews.includes(viewName)) viewName = 'landing';

    this.currentView = viewName;
    if (updateHash) {
      window.location.hash = viewName;
    }

    // Hide all view containers
    document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));

    // Show target view container
    const activeEl = document.getElementById(`view-${viewName}`);
    if (activeEl) {
      activeEl.classList.remove('hidden');

      // Call component render function safely
      const renderFnName = `render${viewName.charAt(0).toUpperCase() + viewName.slice(1)}View`;
      if (typeof window[renderFnName] === 'function') {
        try {
          window[renderFnName]();
        } catch (e) {
          console.error(`Error rendering view ${viewName}:`, e);
        }
      }
    }

    // Update navigation active styles
    document.querySelectorAll('[data-nav]').forEach(nav => {
      const target = nav.getAttribute('data-nav');
      if (target === viewName) {
        nav.classList.add('bg-tertiary', 'font-extrabold', 'border-color');
        nav.classList.remove('text-secondary', 'hover:bg-tertiary');
      } else {
        nav.classList.remove('bg-tertiary', 'font-extrabold', 'border-color');
        nav.classList.add('text-secondary', 'hover:bg-tertiary');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Safe Lucide icon call
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
  window.appRouter.init();
});
