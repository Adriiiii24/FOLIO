import 'server-only';
import { BriefingSchema } from '@/lib/ai/schemas/briefing';
import { createClient } from '@/lib/supabase/server';
import { getProfile, getToday } from '@/modules/settings/queries';
import type { Metrics } from './signals';
import { renderWithMetrics } from './render';

export type BriefingView = {
  id: string;
  headline: string;
  insights: {
    id: string;
    module: 'gym' | 'vault' | 'brain' | 'nutrition' | 'media' | 'routine';
    severity: 'info' | 'positive' | 'warning';
    text: string;
    action: { kind: 'open' | 'log' | 'ask'; label: string; payload: string };
  }[];
  reflection: string | null;
  firstViewToday: boolean;
};

/**
 * Briefing de hoy con las cifras ya pintadas: el modelo escribió marcadores y aquí se sustituyen por los
 * valores de `metrics`, calculados en SQL. `enabled` distingue «aún no ha llegado» de «desactivado».
 */
export async function getTodayBriefing(): Promise<{ enabled: boolean; briefing: BriefingView | null }> {
  const [{ today }, profile] = await Promise.all([getToday(), getProfile()]);
  if (!profile.briefing_enabled) return { enabled: false, briefing: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('daily_briefings')
    .select('id, content, metrics, read_at')
    .eq('briefing_date', today)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { enabled: true, briefing: null };

  // El contenido se validó al guardarlo; se vuelve a comprobar su forma por si el esquema ha cambiado.
  const content = BriefingSchema.safeParse(data.content);
  if (!content.success) return { enabled: true, briefing: null };
  const metrics = data.metrics as Metrics;
  const render = (text: string) => renderWithMetrics(text, metrics);

  return {
    enabled: true,
    briefing: {
      id: data.id,
      headline: render(content.data.headline),
      insights: content.data.insights.map((insight) => ({
        id: insight.id,
        module: insight.module,
        severity: insight.severity,
        text: render(insight.text),
        action: { ...insight.action, label: render(insight.action.label) },
      })),
      reflection: content.data.reflection ? render(content.data.reflection) : null,
      firstViewToday: data.read_at === null,
    },
  };
}
