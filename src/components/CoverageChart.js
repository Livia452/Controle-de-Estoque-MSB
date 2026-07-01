import { COVERAGE_GOAL_MONTHS } from '../constants.js';

let chartInstance = null;

export function renderCoverageChart(products) {
  return `
    <section class="chart-section" aria-label="Gráfico de cobertura por produto">
      <p class="section-title">Cobertura por produto (meses)</p>
      <div class="chart-wrapper">
        <canvas id="coverageChart" role="img"
          aria-label="Gráfico de barras com cobertura em meses por produto acabado.">
        </canvas>
      </div>
      <div class="chart-legend" aria-hidden="true">
        <span><span class="legend-swatch" style="background:#3B6D11"></span>Adequado (≥2m)</span>
        <span><span class="legend-swatch" style="background:#BA7517"></span>Atenção (1–2m)</span>
        <span><span class="legend-swatch" style="background:#A32D2D"></span>Crítico (&lt;1m)</span>
        <span class="legend-line"><span class="legend-dash"></span>Meta mínima (2m)</span>
      </div>
    </section>`;
}

export function mountCoverageChart(products) {
  const canvas = document.getElementById('coverageChart');
  if (!canvas || !window.Chart) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const sorted   = [...products].sort((a, b) => a.coverage - b.coverage);
  const labels   = sorted.map(p => p.code);
  const data     = sorted.map(p => Number.isFinite(p.coverage) ? +p.coverage.toFixed(1) : 0);
  const colors   = sorted.map(p => p.statusMeta.colorHex);

  chartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:           'Cobertura (meses)',
          data,
          backgroundColor: colors,
          borderRadius:    4,
          borderSkipped:   false,
        },
        {
          type:        'line',
          label:       'Meta mínima',
          data:        Array(labels.length).fill(COVERAGE_GOAL_MONTHS),
          borderColor: '#185FA5',
          borderWidth: 2,
          borderDash:  [5, 4],
          pointRadius: 0,
          fill:        false,
          tension:     0,
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y} meses` },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Meses', font: { size: 11 } },
          ticks: { stepSize: 1 },
        },
        x: {
          ticks: { autoSkip: false, maxRotation: 0, font: { size: 11 } },
        },
      },
    },
  });
}
