import { STATUS } from '../constants.js';

export function renderAlertBanner(products) {
  const critical = products.filter(p => p.status === STATUS.CRITICAL);
  if (!critical.length) return '';

  const items = critical.map(p => `<strong>${p.code}</strong> – ${p.description}`).join(' &nbsp;|&nbsp; ');
  return `
    <div class="alert-banner" role="alert">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i>
      Cobertura crítica (&lt;1 mês): ${items}. Acionar produção imediatamente.
    </div>`;
}
