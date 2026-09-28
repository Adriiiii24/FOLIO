import { describe, expect, it } from 'vitest';
import {
  guessCategory,
  interpret,
  normalizeAmount,
  parseMedia,
  parseSets,
  parseTransaction,
} from '@/modules/quick/parse';

describe('importes', () => {
  it.each([
    ['12,40', '12,40'],
    ['12.40', '12,40'],
    ['1.200', '1200'],
    ['1.200,50', '1200,50'],
    ['8', '8'],
  ])('%s → %s', (raw, expected) => expect(normalizeAmount(raw)).toBe(expected));
});

describe('movimientos', () => {
  it('importe primero', () => {
    expect(parseTransaction('12,40 mercadona')).toEqual({
      kind: 'transaction',
      values: { kind: 'expense', amount: '12,40', merchant: 'Mercadona', category: 'groceries' },
    });
  });
  it('comercio primero y símbolo de euro', () => {
    expect(parseTransaction('gasolina repsol 45€')?.values).toMatchObject({
      amount: '45',
      merchant: 'Gasolina repsol',
      category: 'transport',
    });
  });
  it('ingreso con signo o palabra clave', () => {
    expect(parseTransaction('+1.200 nómina')?.values).toMatchObject({
      kind: 'income',
      amount: '1200',
      category: 'salary',
    });
    expect(parseTransaction('ingreso 50 bizum de Ana')?.values).toMatchObject({ kind: 'income' });
  });
  it('sin importe no hay movimiento', () => {
    expect(parseTransaction('mercadona')).toBeNull();
  });
  it('categoría insensible a tildes', () => {
    expect(guessCategory('Farmacia Pérez')).toBe('health');
    expect(guessCategory('Cafetería')).toBe('restaurants');
    expect(guessCategory('Algo raro')).toBe('other');
  });
});

describe('series', () => {
  it('formato compacto', () => {
    expect(parseSets('sentadilla 5x5 a 100')?.values).toEqual({
      exercise: 'Sentadilla',
      count: 5,
      reps: 5,
      weightKg: '100',
    });
  });
  it('formato hablado', () => {
    expect(parseSets('press banca, 4 series de 8 a 80')?.values).toEqual({
      exercise: 'Press banca',
      count: 4,
      reps: 8,
      weightKg: '80',
    });
  });
  it('sin peso es peso corporal', () => {
    expect(parseSets('dominadas 3x10')?.values).toMatchObject({ weightKg: '0' });
  });
  it('decimales en el peso', () => {
    expect(parseSets('curl 3×12 12,5 kg')?.values).toMatchObject({ weightKg: '12,5' });
  });
});

describe('consumo cultural', () => {
  it('terminado con nota', () => {
    expect(parseMedia('terminado: Dune, 9')?.values).toEqual({
      kind: 'book',
      status: 'done',
      title: 'Dune',
      rating: '9',
    });
  });
  it('tipo por palabra y nota sobre 10', () => {
    expect(parseMedia('visto: la película Perfect Days 8/10')?.values).toEqual({
      kind: 'film',
      status: 'done',
      title: 'Perfect Days',
      rating: '8',
    });
  });
  it('en curso por el verbo', () => {
    expect(parseMedia('viendo: The Bear')?.values).toMatchObject({
      kind: 'series',
      status: 'in_progress',
      title: 'The Bear',
    });
  });
  it('un verbo desconocido no es una ficha', () => {
    expect(parseMedia('mañana: dentista')).toBeNull();
  });
});

describe('despacho por pestaña', () => {
  it('HOME prueba los prefijos antes que el importe', () => {
    expect(interpret('home', 'hecho: meditar')).toMatchObject({
      ok: true,
      draft: { kind: 'habit', values: { habitName: 'Meditar' } },
    });
    expect(interpret('home', '12,40 Mercadona')).toMatchObject({ ok: true, draft: { kind: 'transaction' } });
    expect(interpret('home', 'sentadilla 5x5 a 100')).toMatchObject({ ok: true, draft: { kind: 'sets' } });
  });
  it('HOME: lo que no encaja es una nota', () => {
    expect(interpret('home', 'Hoy he dormido fatal')).toMatchObject({ ok: true, draft: { kind: 'note' } });
  });
  it('VAULT sin importe explica qué escribir', () => {
    const result = interpret('vault', 'mercadona');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('12,40 Mercadona');
  });
  it('ROUTINE: cualquier texto es un hábito', () => {
    expect(interpret('routine', 'leer 20 minutos')).toMatchObject({
      ok: true,
      draft: { kind: 'habit', values: { habitName: 'Leer 20 minutos' } },
    });
  });
  it('texto vacío no produce borrador', () => {
    expect(interpret('brain', '   ').ok).toBe(false);
  });
});
