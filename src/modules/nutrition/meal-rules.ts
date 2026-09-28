import type { AiMetaInput } from '@/lib/ai/draft-meta';
import type { MealExtraction } from '@/lib/ai/schemas/meal';

type Macros = { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number };

export type MealDraft = {
  description: string;
  mealType: MealExtraction['mealType'];
  totals: Macros;
  confidence: number;
  warnings: string[];
  meta: AiMetaInput;
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

/** Los totales se suman aquí, no se aceptan del modelo, y se contrastan con Atwater (4/4/9 kcal por gramo). */
export function validateMeal(extraction: MealExtraction, photoPath: string): MealDraft {
  const items = extraction.items.slice(0, 40).map((item) => ({
    name: item.name.trim().slice(0, 120),
    estimatedGrams: Math.min(5000, Math.round(positive(item.estimatedGrams))),
    caloriesKcal: Math.min(10_000, Math.round(positive(item.caloriesKcal))),
    proteinG: Math.min(2000, round1(positive(item.proteinG))),
    carbsG: Math.min(2000, round1(positive(item.carbsG))),
    fatG: Math.min(2000, round1(positive(item.fatG))),
  }));

  const totals = items.reduce<Macros>(
    (sum, item) => ({
      caloriesKcal: sum.caloriesKcal + item.caloriesKcal,
      proteinG: round1(sum.proteinG + item.proteinG),
      carbsG: round1(sum.carbsG + item.carbsG),
      fatG: round1(sum.fatG + item.fatG),
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const warnings = [...extraction.warnings];
  const atwater = 4 * totals.proteinG + 4 * totals.carbsG + 9 * totals.fatG;
  const deviation = totals.caloriesKcal > 0 ? Math.abs(totals.caloriesKcal - atwater) / totals.caloriesKcal : 0;
  if (deviation > 0.15) {
    warnings.push(
      `Las kcal no cuadran con los macros (${Math.round(deviation * 100)} % de diferencia). Revisa las porciones.`,
    );
  }
  if (extraction.hiddenCaloriesNote) warnings.push(extraction.hiddenCaloriesNote);
  if (items.length === 0) warnings.push('No se ha identificado ningún alimento.');

  const confidence = Math.min(1, Math.max(0, extraction.confidence));
  return {
    description: extraction.description.trim().slice(0, 300) || 'Plato sin identificar',
    mealType: extraction.mealType,
    totals,
    confidence,
    warnings,
    meta: { source: 'photo', path: photoPath, confidence, items, raw: extraction },
  };
}
