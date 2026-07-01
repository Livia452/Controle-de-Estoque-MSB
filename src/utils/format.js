const ptBR = new Intl.NumberFormat('pt-BR');
const ptBR1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmt = {
  integer: n  => ptBR.format(Math.round(n)),
  decimal: n  => ptBR1.format(n),
  pct:     n  => ptBR1.format(n) + '%',

  coverage: n => {
    if (!Number.isFinite(n)) return '—';
    return ptBR1.format(n) + ' m';
  },

  monthLabel: (offsetFromCurrent) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offsetFromCurrent);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  },

  datetime: () => new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }),
};
