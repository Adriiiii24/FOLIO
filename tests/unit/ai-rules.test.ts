import { describe, expect, it } from 'vitest';
import { parseAiMeta } from '@/lib/ai/draft-meta';
import type { Briefing } from '@/lib/ai/schemas/briefing';
import type { MealExtraction } from '@/lib/ai/schemas/meal';
import type { TicketExtraction } from '@/lib/ai/schemas/ticket';
import { renderWithMetrics } from '@/modules/home/briefing/render';
import { detectSignals, type Metrics } from '@/modules/home/briefing/signals';
import { validateBriefing } from '@/modules/home/briefing/validate';
import { validateMeal } from '@/modules/nutrition/meal-rules';
import { validateReceipt } from '@/modules/vault/receipt-rules';

const USER = 'a8dc12fd-5538-4fef-acb7-d535e1d40f6f';
const PATH = `${USER}/46fde5ca-cbd0-4bc8-8d5d-3bab3caca093.webp`;

describe('reglas del ticket: avisan, no rechazan', () => {
  const ticket: TicketExtraction = {
    merchant: ' SUPERMERCADOS LA ESQUINA S.L. ',
    merchantTaxId: 'B12345678',
    issuedAt: '2026-09-26T19:42',
    currency: 'EUR',
    total: 19.51,
    category: 'groceries',
    paymentMethod: 'card',
    vat: [
      { ratePct: 4, base: 5.59, amount: 0.22 },
      { ratePct: 10, base: 8.14, amount: 0.81 },
      { ratePct: 21, base: 3.93, amount: 0.82 },
    ],
    lineItems: [],
    confidence: 0.95,
    warnings: [],
  };
  const context = { nowLocal: '2026-09-28T10:00', currency: 'EUR' };

  it('un ticket coherente no avisa y suma el IVA', () => {
    const draft = validateReceipt(ticket, PATH, context);
    expect(draft.warnings).toEqual([]);
    expect(draft.merchant).toBe('SUPERMERCADOS LA ESQUINA S.L.');
    expect(draft.meta).toMatchObject({ source: 'ocr', path: PATH, taxAmount: 1.85 });
  });

  it('IVA descuadrado, otra moneda y fecha futura', () => {
    const draft = validateReceipt(
      { ...ticket, total: 25, currency: 'USD', issuedAt: '2026-10-02T09:00' },
      PATH,
      context,
    );
    expect(draft.warnings.join(' ')).toMatch(/no cuadra/);
    expect(draft.warnings.join(' ')).toMatch(/USD/);
    expect(draft.warnings.join(' ')).toMatch(/futuro/);
    expect(draft.issuedAtLocal).toBeNull();
  });
});

describe('reglas del plato', () => {
  const plate: MealExtraction = {
    description: 'Pollo con arroz',
    mealType: 'lunch',
    items: [
      { name: 'arroz', estimatedGrams: 200, caloriesKcal: 260, proteinG: 5, carbsG: 57, fatG: 0.6 },
      { name: 'pollo', estimatedGrams: 150, caloriesKcal: 248, proteinG: 46, carbsG: 0, fatG: 5.4 },
    ],
    hiddenCaloriesNote: null,
    confidence: 0.8,
    warnings: [],
  };

  it('los totales se suman en el dominio', () => {
    const draft = validateMeal(plate, PATH);
    expect(draft.totals).toEqual({ caloriesKcal: 508, proteinG: 51, carbsG: 57, fatG: 6 });
    expect(draft.warnings).toEqual([]);
  });

  it('avisa si las kcal no cuadran con Atwater', () => {
    const draft = validateMeal({ ...plate, items: [{ ...plate.items[0]!, caloriesKcal: 900 }] }, PATH);
    expect(draft.warnings.join(' ')).toMatch(/no cuadran/);
  });
});

describe('metadato del borrador', () => {
  it('sin campo: alta manual', () => {
    expect(parseAiMeta(null, USER)).toBeNull();
    expect(parseAiMeta('', USER)).toBeNull();
  });

  it('válido y en la carpeta propia', () => {
    const meta = parseAiMeta(JSON.stringify({ source: 'ocr', path: PATH, confidence: 0.873 }), USER);
    expect(meta).toMatchObject({ source: 'ocr', path: PATH, confidence: 0.87 });
  });

  it('archivo de otra persona, JSON roto u origen falso', () => {
    const other = `ef784cd6-994a-4c01-a547-d4f30fdafcc7/46fde5ca-cbd0-4bc8-8d5d-3bab3caca093.webp`;
    expect(parseAiMeta(JSON.stringify({ source: 'ocr', path: other, confidence: 1 }), USER)).toBe('invalid');
    expect(parseAiMeta('{roto', USER)).toBe('invalid');
    expect(parseAiMeta(JSON.stringify({ source: 'manual', path: null, confidence: null }), USER)).toBe('invalid');
  });
});

describe('briefing: el modelo redacta, SQL pone las cifras', () => {
  const metrics: Metrics = {
    'vault.spend_mtd': { value: 812.4, unit: 'eur', label: 'gasto del mes' },
    'focus.minutes_7d': { value: 95, unit: 'min', label: 'foco' },
    'gym.sessions_7d': { value: 0, unit: 'count', label: 'entrenos' },
  };
  const insight = (id: string, text: string) => ({
    id,
    module: 'vault' as const,
    severity: 'info' as const,
    text,
    evidence: [],
    action: { kind: 'open' as const, label: 'Abrir', payload: '/vault' },
  });
  const briefing = (texts: string[]): Briefing => ({
    headline: 'Un mes con {{vault.spend_mtd}} gastados',
    insights: texts.map((text, index) => insight(`h${index}`, text)),
    reflection: null,
  });

  it('acepta marcadores conocidos y artículos como «una»', () => {
    const result = validateBriefing(
      briefing([
        'Llevas {{vault.spend_mtd}} este mes.',
        'Una semana con {{focus.minutes_7d}} de foco.',
        'Sin entrenos: {{gym.sessions_7d}}.',
      ]),
      metrics,
    );
    expect(result.problems).toEqual([]);
    expect(result.briefing?.insights).toHaveLength(3);
  });

  it('descarta cifras a mano, marcadores inventados y unidades repetidas', () => {
    const result = validateBriefing(
      briefing([
        'Gastaste 812 euros.',
        'Dos semanas sin entrenar.',
        '{{focus.minutes_7d}} minutos de foco.',
        'Y {{no.existe}}.',
      ]),
      metrics,
    );
    expect(result.briefing).toBeNull();
    expect(result.problems.join(' ')).toMatch(/cifra escrita a mano/);
    expect(result.problems.join(' ')).toMatch(/unidad repetida/);
    expect(result.problems.join(' ')).toMatch(/marcador desconocido/);
  });

  it('«gastados» detrás de un importe no es una unidad repetida', () => {
    expect(
      validateBriefing(briefing(['a {{vault.spend_mtd}}', 'b {{gym.sessions_7d}}', 'c {{focus.minutes_7d}}']), metrics)
        .problems,
    ).toEqual([]);
  });

  it('la interfaz pinta los valores', () => {
    // Intl separa importe y símbolo con un espacio de no separación (U+00A0): se normaliza para comparar.
    const text = renderWithMetrics('Llevas {{vault.spend_mtd}} y {{focus.minutes_7d}}; {{x.y}}', metrics);
    expect(text.replace(/ /g, ' ')).toBe('Llevas 812,40 € y 95 min; —');
  });

  it('detecta el gasto por delante del calendario y la semana sin entrenar', () => {
    const signals = detectSignals({
      ...metrics,
      'vault.budget_used_pct': { value: 80, unit: 'pct', label: '' },
      'vault.month_elapsed_pct': { value: 50, unit: 'pct', label: '' },
    });
    expect(signals.map((signal) => signal.module)).toEqual(['vault', 'gym']);
  });
});
