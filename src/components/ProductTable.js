import { fmt } from '../utils/format.js';

const TREND_HTML = {
  up:     pct => `<span class="trend-up"><i class="ti ti-trending-up" aria-hidden="true"></i> +${pct}%</span>`,
  down:   pct => `<span class="trend-down"><i class="ti ti-trending-down" aria-hidden="true"></i> -${pct}%</span>`,
  stable: ()  => `<span class="trend-stable"><i class="ti ti-minus" aria-hidden="true"></i> Estável</span>`,
};

function coverageBar(product) {
  const maxMonths = 4;
  const pct       = Math.min(100, (product.coverage / maxMonths) * 100);
  const color     = product.statusMeta.colorHex;
  return `<div class="cov-bar" aria-hidden="true"><div class="cov-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>`;
}

function productRow(product) {
  const { label, badgeClass } = product.statusMeta;
  const trend = TREND_HTML[product.salesTrend.direction](product.salesTrend.pct);

  return `
    <tr data-code="${product.code}">
      <td><strong>${product.code}</strong></td>
      <td>${product.description}</td>
      <td class="num">${fmt.integer(product.stock)}</td>
      <td class="num">${fmt.integer(product.avgConsumption)} un/mês</td>
      <td class="num">
        ${fmt.coverage(product.coverage)}
        ${coverageBar(product)}
      </td>
      <td><span class="badge ${badgeClass}">${label}</span></td>
      <td>${trend}</td>
    </tr>`;
}

export function renderProductTable(products) {
  const sorted = [...products].sort((a, b) => a.coverage - b.coverage);
  const rows   = sorted.length
    ? sorted.map(productRow).join('')
    : `<tr><td colspan="7" class="empty-state">Nenhum produto cadastrado.</td></tr>`;

  return `
    <div class="table-wrapper" role="region" aria-label="Tabela de estoque de produto acabado" tabindex="0">
      <table class="product-table">
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Descrição</th>
            <th scope="col" class="num">Estoque (un)</th>
            <th scope="col" class="num">Consumo médio/mês</th>
            <th scope="col" class="num">Cobertura</th>
            <th scope="col">Status</th>
            <th scope="col">Tendência 6m</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
