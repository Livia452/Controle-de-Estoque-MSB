export const STORAGE_KEY = 'pcp_pa_v1';
export const MONTHS_COUNT = 6;

export const COVERAGE_THRESHOLDS = Object.freeze({
  CRITICAL: 1,
  WARNING: 2,
});

export const STATUS = Object.freeze({
  CRITICAL: 'critical',
  WARNING:  'warning',
  OK:       'ok',
});

export const STATUS_META = Object.freeze({
  [STATUS.CRITICAL]: { label: 'Crítico',   colorHex: '#A32D2D', badgeClass: 'badge-crit' },
  [STATUS.WARNING]:  { label: 'Atenção',   colorHex: '#BA7517', badgeClass: 'badge-warn' },
  [STATUS.OK]:       { label: 'Adequado',  colorHex: '#3B6D11', badgeClass: 'badge-ok'   },
});

export const COVERAGE_GOAL_MONTHS = 2;

export const SEED_PRODUCTS = [
  { code: 'PA-001', description: 'Produto A – Linha Premium',   stock: 850,  monthlySales: [120,135,128,142,130,138] },
  { code: 'PA-002', description: 'Produto B – Linha Econômica', stock: 210,  monthlySales: [95,102,98,110,105,108] },
  { code: 'PA-003', description: 'Produto C – Exportação',      stock: 60,   monthlySales: [45,50,52,48,55,53] },
  { code: 'PA-004', description: 'Produto D – Sazonal',         stock: 30,   monthlySales: [22,18,25,30,28,32] },
  { code: 'PA-005', description: 'Produto E – Alta Rotação',    stock: 1200, monthlySales: [380,395,410,402,390,415] },
  { code: 'PA-006', description: 'Produto F – Especial',        stock: 15,   monthlySales: [20,18,22,19,21,20] },
];
