import { COVERAGE_THRESHOLDS, STATUS, STATUS_META, MONTHS_COUNT } from '../constants.js';

export class Product {
  constructor({ code, description, stock, monthlySales }) {
    if (!code || typeof code !== 'string') throw new Error('Product: código inválido');
    if (!description || typeof description !== 'string') throw new Error('Product: descrição inválida');
    if (!Number.isFinite(stock) || stock < 0) throw new Error('Product: estoque inválido');
    if (!Array.isArray(monthlySales) || monthlySales.length !== MONTHS_COUNT) {
      throw new Error(`Product: monthlySales deve ter exatamente ${MONTHS_COUNT} entradas`);
    }

    this.code        = code.toUpperCase().trim();
    this.description = description.trim();
    this.stock       = Math.round(stock);
    this.monthlySales = monthlySales.map(v => Math.max(0, Math.round(v)));
  }

  get avgConsumption() {
    return this.monthlySales.reduce((sum, v) => sum + v, 0) / this.monthlySales.length;
  }

  get coverage() {
    const avg = this.avgConsumption;
    return avg > 0 ? this.stock / avg : Infinity;
  }

  get status() {
    const cov = this.coverage;
    if (cov < COVERAGE_THRESHOLDS.CRITICAL) return STATUS.CRITICAL;
    if (cov < COVERAGE_THRESHOLDS.WARNING)  return STATUS.WARNING;
    return STATUS.OK;
  }

  get statusMeta() {
    return STATUS_META[this.status];
  }

  get salesTrend() {
    const half = Math.floor(this.monthlySales.length / 2);
    const older = this.monthlySales.slice(0, half);
    const recent = this.monthlySales.slice(half);
    const avgOlder  = older.reduce((s, v) => s + v, 0) / older.length;
    const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;

    if (avgOlder === 0) return { direction: 'stable', pct: 0 };
    const pct = ((avgRecent - avgOlder) / avgOlder) * 100;
    if (pct > 5)  return { direction: 'up',   pct: Math.round(pct) };
    if (pct < -5) return { direction: 'down', pct: Math.round(Math.abs(pct)) };
    return { direction: 'stable', pct: 0 };
  }

  toJSON() {
    return {
      code:         this.code,
      description:  this.description,
      stock:        this.stock,
      monthlySales: this.monthlySales,
    };
  }

  static fromJSON(raw) {
    return new Product(raw);
  }
}
