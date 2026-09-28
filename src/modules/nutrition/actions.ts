'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { parseAiMeta } from '@/lib/ai/draft-meta';
import { zonedToUtcIso } from '@/lib/dates';
import type { Json } from '@/lib/supabase/database.types';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';
import { atwaterWarning, MealFormSchema } from './form';

function revalidate() {
  revalidatePath('/nutrition');
  revalidatePath('/home');
}

export async function saveMeal(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = MealFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, mealType, description, caloriesKcal, proteinG, carbsG, fatG, eatenAt } = parsed.data;

  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');
  // Un borrador de foto trae sus alimentos, la ruta y la confianza. Solo en altas.
  const ai = id ? null : parseAiMeta(formData.get('ai'), userId);
  if (ai === 'invalid') return failure('El borrador no es válido. Descártalo y vuelve a intentarlo.');

  const profile = await getProfile();
  const row = {
    meal_type: mealType,
    description,
    calories_kcal: caloriesKcal,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    eaten_at: zonedToUtcIso(eatenAt, profile.timezone),
  };

  const query = id
    ? supabase.from('macros').update(row).eq('id', id).select('id').single()
    : supabase
        .from('macros')
        .insert({
          ...row,
          source: ai?.source ?? 'manual',
          items: ai?.items ?? [],
          photo_path: ai?.path ?? null,
          ai_confidence: ai?.confidence ?? null,
          raw_extraction: (ai?.raw ?? null) as Json,
        })
        .select('id')
        .single();
  const { data, error } = await query;
  if (error) return fromDb(error);

  revalidate();
  // Las reglas de dominio no rechazan: avisan (ARCHITECTURE §3.4). Se guarda y se dice.
  const warning = atwaterWarning(caloriesKcal, proteinG, carbsG, fatG);
  const saved = id ? 'Comida actualizada.' : 'Comida guardada.';
  return success(warning ? `${saved} ${warning}` : saved, data.id);
}

export async function deleteMeal(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('macros').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Esa comida ya no existe.');
  revalidate();
  return success('Comida borrada.');
}
