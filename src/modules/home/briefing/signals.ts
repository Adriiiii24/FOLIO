// Reglas puras del briefing: sin base de datos ni red, para poder probarlas.

export type MetricUnit = 'eur' | 'kcal' | 'g' | 'min' | 'count' | 'pct' | 'days';
export type Metric = { value: number; unit: MetricUnit; label: string };
export type Metrics = Record<string, Metric>;

export type BriefingSignal = {
  module: 'gym' | 'vault' | 'brain' | 'nutrition' | 'media' | 'routine';
  severity: 'info' | 'positive' | 'warning';
  priority: number;
  /** Descripción para el redactor, con las cifras ya como marcadores. */
  fact: string;
};

/** Paso 2 · Detectar: reglas deterministas. El modelo solo redacta y prioriza lo que salga de aquí. */
export function detectSignals(m: Metrics): BriefingSignal[] {
  const signals: BriefingSignal[] = [];
  const v = (key: string) => m[key]?.value;

  const used = v('vault.budget_used_pct');
  const elapsed = v('vault.month_elapsed_pct');
  if (used !== undefined && elapsed !== undefined && used > elapsed + 10) {
    signals.push({
      module: 'vault',
      severity: 'warning',
      priority: 90,
      fact: 'Gasto por delante del calendario: {{vault.budget_used_pct}} del presupuesto con el {{vault.month_elapsed_pct}} del mes transcurrido.',
    });
  }
  const kcal = v('nutrition.kcal_yesterday');
  const kcalTarget = v('nutrition.kcal_target');
  if (kcal !== undefined && kcalTarget && kcal > kcalTarget * 1.15) {
    signals.push({
      module: 'nutrition',
      severity: 'warning',
      priority: 65,
      fact: 'Ayer {{nutrition.kcal_yesterday}}, por encima del objetivo de {{nutrition.kcal_target}}.',
    });
  }
  const protein = v('nutrition.protein_yesterday');
  const proteinTarget = v('nutrition.protein_target');
  if (protein !== undefined && proteinTarget && protein < proteinTarget * 0.8) {
    signals.push({
      module: 'nutrition',
      severity: 'warning',
      priority: 70,
      fact: 'Proteína de ayer {{nutrition.protein_yesterday}}, por debajo del objetivo de {{nutrition.protein_target}}.',
    });
  }
  const streak = v('routine.best_streak');
  if (streak !== undefined && streak >= 7) {
    signals.push({
      module: 'routine',
      severity: 'positive',
      priority: 50,
      fact: 'Racha activa de {{routine.best_streak}}.',
    });
  }
  if (v('gym.sessions_7d') === 0) {
    signals.push({
      module: 'gym',
      severity: 'info',
      priority: 60,
      fact: 'Sin entrenos registrados en la última semana: {{gym.sessions_7d}}.',
    });
  }
  if (v('brain.notes_7d') === 0) {
    signals.push({
      module: 'brain',
      severity: 'info',
      priority: 40,
      fact: 'Diario sin entradas en la última semana: {{brain.notes_7d}}.',
    });
  }
  return signals.sort((a, b) => b.priority - a.priority);
}
