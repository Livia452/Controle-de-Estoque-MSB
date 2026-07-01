import { fmt } from '../utils/format.js';
import { STATUS } from '../constants.js';

export function renderKpiCards(products) {
  const totalStock    = products.reduce((s, p) => s + p.stock, 0);
  const avgCoverage   = products.length
    ? products.reduce((s, p) => s + (Number.isFinite(p.coverage) ? p.coverage : 0), 0) / products.length
    : 0;
  const criticalCount = products.filter(p => p.status === STATUS.CRITICAL).length;
  const warningCount  = products.filter(p => p.status === STATUS.WARNING).length;

  const card = (icon, label, value, sub, colorClass = '') => `
    <div class="kpi-card">
      <p class="kpi-label"><i class="ti ${icon}" aria-hidden="true"></i> ${label}</p>
      <p class="kpi-value ${colorClass}">${value}</p>
      <p class="kpi-sub">${sub}</p>
    </div>`;

  return `
    <div class="kpi-grid" role="region" aria-label="KPIs de estoque">
      ${card('ti-package',       'Total em estoque',   fmt.integer(totalStock) + ' un',      products.length + ' produtos')}
      ${card('ti-calendar',      'Cobertura média',    fmt.coverage(avgCoverage),             'Meta ≥ 2 meses')}
      ${card('ti-alert-triangle','Em atenção',         warningCount,                          'Cobertura 1–2 meses', warningCount > 0 ? 'text-warning' : '')}
      ${card('ti-alert-circle',  'Críticos',           criticalCount,                         'Cobertura < 1 mês',   criticalCount > 0 ? 'text-danger'  : '')}
    </div>`;
}
