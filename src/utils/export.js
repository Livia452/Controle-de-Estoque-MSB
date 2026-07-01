import { fmt } from './format.js';

export function exportToCSV(products) {
  const header = ['Código', 'Descrição', 'Estoque (un)', 'Consumo médio/mês', 'Cobertura (meses)', 'Status'];
  const rows = products.map(p => [
    p.code,
    `"${p.description}"`,
    p.stock,
    fmt.decimal(p.avgConsumption),
    fmt.coverage(p.coverage),
    p.statusMeta.label,
  ]);

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `estoque_pa_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}
