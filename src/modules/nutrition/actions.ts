'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { zonedToUtcIso } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
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

  const supabase = await createClient();
  const query = id
    ? supabase.from('macros').update(row).eq('id', id).select('id').single()
    : supabase
        .from('macros')
        .insert({ ...row, source: 'manual' })
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
