// Formato español con Intl (DESIGN_SYSTEM §3.4). Ojo: es-ES no agrupa las cifras de cuatro dígitos
// (1284, pero 12.840). Es la norma, no un fallo.

export function money(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value);
}

export function number(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(value);
}

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

/** «27 sept.» */
export function shortDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    dateFromIso(isoDate),
  );
}

/** «domingo, 27 de septiembre» */
export function longDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    dateFromIso(isoDate),
  );
}

/** «DOM» */
export function weekdayShort(isoDate: string): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', timeZone: 'UTC' })
    .format(dateFromIso(isoDate))
    .replace('.', '')
    .toUpperCase();
}

/** «septiembre de 2026» */
export function monthName(isoDate: string): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    dateFromIso(isoDate),
  );
}

/** «27‘09»: la fecha protagonista de 01 // INICIO (§3.4, regla 5). */
export function posterDate(isoDate: string): string {
  return `${isoDate.slice(8, 10)}‘${isoDate.slice(5, 7)}`;
}

/** «12 min», «1 h 05 min» */
export function minutes(total: number): string {
  const rounded = Math.round(total);
  if (rounded < 60) return `${rounded} min`;
  return `${Math.floor(rounded / 60)} h ${String(rounded % 60).padStart(2, '0')} min`;
}

export function plural(count: number, one: string, many: string): string {
  return `${number(count)} ${count === 1 ? one : many}`;
}
