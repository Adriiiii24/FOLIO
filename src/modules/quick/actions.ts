'use server';

import { TABS } from '@/config/tabs';
import { utcIsoToZonedInput } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { mealTypeForHour } from '@/modules/nutrition/form';
import { sameHabitName } from '@/modules/routine/form';
import { getProfile } from '@/modules/settings/queries';
import { interpret, type QuickDraft } from './parse';

export type DraftContext = {
  /** Fecha y hora local ('YYYY-MM-DDTHH:mm') en la zona del perfil. */
  now: string;
  today: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  currency: string;
  habitExists: boolean;
};

export type InterpretedDraft = QuickDraft & { context: DraftContext };

/**
 * Convierte el texto de la barra en un borrador. No escribe nada: guardar es otra acción, la del
 * módulo, y solo ocurre cuando la persona confirma el borrador.
 */
export async function interpretQuickText(
  tab: string,
  text: string,
): Promise<{ ok: true; draft: InterpretedDraft } | { ok: false; message: string }> {
  const slug = TABS.find((entry) => entry.slug === tab)?.slug ?? 'home';
  const result = interpret(slug, text.slice(0, 2000));
  if (!result.ok) return result;

  const profile = await getProfile();
  const now = utcIsoToZonedInput(new Date().toISOString(), profile.timezone);
  let habitExists = false;
  if (result.draft.kind === 'habit') {
    const supabase = await createClient();
    const { data } = await supabase.from('habits').select('name').is('archived_at', null);
    const name = result.draft.values.habitName;
    habitExists = (data ?? []).some((habit) => sameHabitName(habit.name, name));
  }

  return {
    ok: true,
    draft: {
      ...result.draft,
      context: {
        now,
        today: now.slice(0, 10),
        mealType: mealTypeForHour(Number(now.slice(11, 13))),
        currency: profile.currency,
        habitExists,
      },
    },
  };
}
