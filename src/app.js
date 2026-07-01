import { DashboardView } from './views/DashboardView.js';
import { EditorView }    from './views/EditorView.js';

const TABS = Object.freeze({ dashboard: 'dashboard', editor: 'editor' });

class App {
  constructor() {
    this._activeTab    = TABS.dashboard;
    this._activeView   = null;
    this._viewContainer = document.getElementById('view-container');
    this._tabs = document.querySelectorAll('[data-tab]');
  }

  init() {
    this._tabs.forEach(btn =>
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab))
    );
    this._switchTab(TABS.dashboard);
  }

  _switchTab(tab) {
    if (!TABS[tab]) return;

    this._tabs.forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    this._activeView?.unmount();
    this._activeTab = tab;

    if (tab === TABS.dashboard) {
      this._activeView = new DashboardView(this._viewContainer);
    } else {
      this._activeView = new EditorView(this._viewContainer, {
        onNavigateToDashboard: () => this._switchTab(TABS.dashboard),
      });
    }

    this._activeView.mount();
  }
}

document.addEventListener('DOMContentLoaded', () => new App().init());
