import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, localDate, monthEnd, utcIsoToZonedInput, weekStart, zonedToUtcIso } from '@/lib/dates';
import { writingStreak } from '@/modules/brain/streak';

describe('día local', () => {
  it('a las 00:30 en Madrid ya es el día siguiente, aunque en UTC no', () => {
    expect(localDate('Europe/Madrid', new Date('2026-09-27T22:30:00Z'))).toBe('2026-09-28');
    expect(localDate('UTC', new Date('2026-09-27T22:30:00Z'))).toBe('2026-09-27');
  });
});

describe('hora local ↔ UTC', () => {
  it('verano (CEST, +2) e invierno (CET, +1)', () => {
    expect(zonedToUtcIso('2026-09-27T09:30', 'Europe/Madrid')).toBe('2026-09-27T07:30:00.000Z');
    expect(zonedToUtcIso('2026-01-15T09:30', 'Europe/Madrid')).toBe('2026-01-15T08:30:00.000Z');
  });
  it('ida y vuelta', () => {
    expect(utcIsoToZonedInput(zonedToUtcIso('2026-10-25T01:15', 'Europe/Madrid'), 'Europe/Madrid')).toBe(
      '2026-10-25T01:15',
    );
  });
  it('otra zona', () => {
    expect(zonedToUtcIso('2026-09-27T09:30', 'America/Mexico_City')).toBe('2026-09-27T15:30:00.000Z');
  });
});

describe('calendario', () => {
  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('lunes de la semana', () => {
    expect(weekStart('2026-09-27')).toBe('2026-09-21'); // domingo → lunes anterior
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
  });
  it('fin de mes y días entre fechas', () => {
    expect(monthEnd('2028-02-10')).toBe('2028-02-29');
    expect(daysBetween('2026-09-01', '2026-09-27')).toBe(26);
  });
});

describe('racha de escritura', () => {
  it('cuenta hasta hoy', () => {
    expect(writingStreak(['2026-09-27', '2026-09-26', '2026-09-25', '2026-09-23'], '2026-09-27')).toBe(3);
  });
  it('si hoy aún no hay entrada, la racha de ayer sigue viva', () => {
    expect(writingStreak(['2026-09-26', '2026-09-25'], '2026-09-27')).toBe(2);
  });
  it('un hueco de dos días la rompe', () => {
    expect(writingStreak(['2026-09-25'], '2026-09-27')).toBe(0);
  });
});
