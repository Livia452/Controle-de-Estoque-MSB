import { state }                         from '../store/state.js';
import { renderKpiCards }                from '../components/KpiCards.js';
import { renderAlertBanner }             from '../components/AlertBanner.js';
import { renderProductTable }            from '../components/ProductTable.js';
import { renderCoverageChart, mountCoverageChart } from '../components/CoverageChart.js';
import { exportToCSV }                   from '../utils/export.js';
import { fmt }                           from '../utils/format.js';

export class DashboardView {
  constructor(container) {
    this.container = container;
    this._unsubscribe = null;
  }

  mount() {
    this._render();
    this._unsubscribe = state.subscribe(() => this._render());
  }

  unmount() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  _render() {
    const products = state.getAll();

    this.container.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <div>
            <h1 class="page-title">Estoque de produto acabado</h1>
            <p class="last-update">Atualizado em ${fmt.datetime()}</p>
          </div>
          <button class="btn btn-outline" id="btn-export">
            <i class="ti ti-download" aria-hidden="true"></i> Exportar CSV
          </button>
        </header>

        ${renderKpiCards(products)}
        ${renderAlertBanner(products)}
        ${renderProductTable(products)}
        ${renderCoverageChart(products)}
      </div>`;

    this.container.querySelector('#btn-export')
      ?.addEventListener('click', () => exportToCSV(products));

    mountCoverageChart(products);
  }
}
