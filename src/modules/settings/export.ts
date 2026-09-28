/** Tablas que se exportan: todas las de la cuenta. Se leen con la sesión, así que RLS limita a las filas propias. */
export const EXPORT_TABLES = [
  'profiles',
  'workouts',
  'workout_logs',
  'financial_transactions',
  'notes',
  'macros',
  'media_items',
  'habits',
  'habit_logs',
  'focus_sessions',
  'daily_briefings',
  'ai_runs',
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

export const EXPORT_LABEL: Record<ExportTable, string> = {
  profiles: 'Perfil',
  workouts: 'Sesiones de entreno',
  workout_logs: 'Series',
  financial_transactions: 'Movimientos',
  notes: 'Diario',
  macros: 'Comidas',
  media_items: 'Consumo cultural',
  habits: 'Hábitos',
  habit_logs: 'Check-ins de hábitos',
  focus_sessions: 'Sesiones de foco',
  daily_briefings: 'Briefings',
  ai_runs: 'Registro de IA',
};
