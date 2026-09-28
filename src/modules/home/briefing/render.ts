import type { Metric, Metrics } from './signals';

const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function formatMetric({ value, unit }: Pick<Metric, 'value' | 'unit'>): string {
  switch (unit) {
    case 'eur':
      return eur.format(value);
    case 'pct':
      return `${number.format(value)} %`;
    case 'kcal':
      return `${number.format(value)} kcal`;
    case 'g':
      return `${number.format(value)} g`;
    case 'min':
      return `${number.format(value)} min`;
    case 'days':
      return value === 1 ? '1 día' : `${number.format(value)} días`;
    case 'count':
      return number.format(value);
  }
}

/** La interfaz pinta las cifras: sustituye cada {{clave}} por el valor calculado en SQL. */
export function renderWithMetrics(text: string, metrics: Metrics): string {
  return text.replace(/\{\{([a-z0-9_.]+)\}\}/g, (_, key: string) => {
    const metric = metrics[key];
    return metric ? formatMetric(metric) : '—';
  });
}
