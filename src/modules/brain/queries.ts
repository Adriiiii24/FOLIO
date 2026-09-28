import 'server-only';
import { addDays } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getToday } from '@/modules/settings/queries';
import { writingStreak } from './streak';

export async function getBrainOverview() {
  const { today } = await getToday();
  const supabase = await createClient();
  const [dates, total] = await Promise.all([
    supabase
      .from('notes')
      .select('entry_date')
      .gte('entry_date', addDays(today, -400))
      .order('entry_date', { ascending: false })
      .limit(2000),
    supabase.from('notes').select('id', { count: 'exact', head: true }),
  ]);
  if (dates.error) throw new Error(dates.error.message);
  if (total.error) throw new Error(total.error.message);
  const entryDates = dates.data.map((row) => row.entry_date);
  return {
    today,
    streak: writingStreak(entryDates, today),
    total: total.count ?? 0,
    writtenToday: entryDates.includes(today),
  };
}

export async function getBrainSheet(search?: string) {
  const overview = await getBrainOverview();
  const supabase = await createClient();
  const query = search?.trim();

  let notes = supabase.from('notes').select('id, entry_date, title, content, mood, tags, source, created_at');
  if (query) {
    // Texto completo en español e insensible a tildes (columna fts). La búsqueda semántica llega con la IA.
    notes = notes.textSearch('fts', query, { config: 'spanish_unaccent', type: 'websearch' });
  }
  const { data, error } = await notes
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(query ? 40 : 30);
  if (error) throw new Error(error.message);

  return { ...overview, query: query ?? '', notes: data };
}
