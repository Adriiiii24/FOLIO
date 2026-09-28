import 'server-only';
import { utcIsoToZonedInput } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { mealTypeForHour } from '@/modules/nutrition/form';
import { sameHabitName } from '@/modules/routine/form';
import { getProfile } from '@/modules/settings/queries';
import type { QuickDraft } from './parse';
import type { DraftContext } from './types';

/** Valores por defecto del borrador, calculados en el servidor con la zona y la moneda del perfil. */
export async function draftContext(draft: QuickDraft): Promise<DraftContext> {
  const profile = await getProfile();
  const now = utcIsoToZonedInput(new Date().toISOString(), profile.timezone);
  let habitExists = false;
  if (draft.kind === 'habit') {
    const supabase = await createClient();
    const { data } = await supabase.from('habits').select('name').is('archived_at', null);
    habitExists = (data ?? []).some((habit) => sameHabitName(habit.name, draft.values.habitName));
  }
  return {
    now,
    today: now.slice(0, 10),
    mealType: mealTypeForHour(Number(now.slice(11, 13))),
    currency: profile.currency,
    habitExists,
  };
}
