// Fechas del usuario. El «día» es siempre el día LOCAL de su zona horaria (profiles.timezone),
// nunca el del servidor, que corre en UTC. Las fechas de calendario viajan como 'YYYY-MM-DD'.

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function zonedParts(at: Date, timeZone: string): Parts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

function isoFromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function splitDate(isoDate: string): [number, number, number] {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
  return [year, month, day];
}

/** Día local 'YYYY-MM-DD' en una zona horaria. */
export function localDate(timeZone: string, at: Date = new Date()): string {
  const p = zonedParts(at, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Hora local 'HH:mm' de un instante. */
export function localTime(iso: string, timeZone: string): string {
  const p = zonedParts(new Date(iso), timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = splitDate(isoDate);
  return isoFromUtcMs(Date.UTC(year, month - 1, day + days));
}

/** Días naturales de `from` a `to` (0 si son el mismo día). */
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = splitDate(from);
  const [y2, m2, d2] = splitDate(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function monthStart(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function monthEnd(isoDate: string): string {
  const [year, month] = splitDate(isoDate);
  return isoFromUtcMs(Date.UTC(year, month, 0));
}

export function yearStart(isoDate: string): string {
  return `${isoDate.slice(0, 4)}-01-01`;
}

/** Lunes de la semana de `isoDate`. */
export function weekStart(isoDate: string): string {
  const [year, month, day] = splitDate(isoDate);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = domingo
  return addDays(isoDate, -((weekday + 6) % 7));
}

function offsetMs(utcMs: number, timeZone: string): number {
  const p = zonedParts(new Date(utcMs), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Instante UTC (ISO) de una hora de reloj local 'YYYY-MM-DDTHH:mm' en una zona horaria.
 * Una hora que no existe (el salto de primavera) se resuelve hacia delante, como hacen los relojes.
 */
export function zonedToUtcIso(local: string, timeZone: string): string {
  const [datePart = '', timePart = '00:00'] = local.split('T');
  const [year, month, day] = splitDate(datePart);
  const [hour = 0, minute = 0] = timePart.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetMs(guess, timeZone);
  let utc = guess - first;
  const second = offsetMs(utc, timeZone);
  if (second !== first) utc = guess - second;
  return new Date(utc).toISOString();
}

/** Valor para <input type="datetime-local"> ('YYYY-MM-DDTHH:mm') de un instante en una zona horaria. */
export function utcIsoToZonedInput(iso: string, timeZone: string): string {
  const p = zonedParts(new Date(iso), timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Límites UTC [desde, hasta) de un rango de días locales, para filtrar columnas timestamptz. */
export function localDayRangeUtc(from: string, to: string, timeZone: string): { fromIso: string; toIso: string } {
  return {
    fromIso: zonedToUtcIso(`${from}T00:00`, timeZone),
    toIso: zonedToUtcIso(`${addDays(to, 1)}T00:00`, timeZone),
  };
}
