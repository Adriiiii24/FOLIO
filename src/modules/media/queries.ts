import 'server-only';
import { yearStart } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getToday } from '@/modules/settings/queries';

export const MEDIA_VIEWS = {
  'en-curso': { status: 'in_progress', label: 'En curso' },
  pendientes: { status: 'backlog', label: 'Pendientes' },
  terminados: { status: 'done', label: 'Terminados' },
  abandonados: { status: 'dropped', label: 'Abandonados' },
} as const;

export type MediaView = keyof typeof MEDIA_VIEWS;

export function resolveMediaView(value?: string): MediaView {
  return value && value in MEDIA_VIEWS ? (value as MediaView) : 'en-curso';
}

export async function getMediaOverview() {
  const { today } = await getToday();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('media_items')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'done')
    .gte('finished_on', yearStart(today));
  if (error) throw new Error(error.message);
  return { finishedThisYear: count ?? 0, year: today.slice(0, 4) };
}

export async function getMediaSheet(view: MediaView) {
  const overview = await getMediaOverview();
  const supabase = await createClient();
  const [items, counts] = await Promise.all([
    supabase
      .from('media_items')
      .select('id, kind, title, creator, status, rating, progress_pct, started_on, finished_on, review, updated_at')
      .eq('status', MEDIA_VIEWS[view].status)
      .order(view === 'terminados' ? 'finished_on' : 'updated_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase.from('media_items').select('status'),
  ]);
  if (items.error) throw new Error(items.error.message);
  if (counts.error) throw new Error(counts.error.message);

  const byStatus = counts.data.reduce<Record<string, number>>(
    (acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }),
    {},
  );
  return { ...overview, view, items: items.data, byStatus, total: counts.data.length };
}
