'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { parseAiMeta } from '@/lib/ai/draft-meta';
import { zonedToUtcIso } from '@/lib/dates';
import type { Json } from '@/lib/supabase/database.types';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';
import { atwaterWarning, MealFormSchema } from './form';
import { DISH_SELECT, dishMatch, DishFormSchema, MealItemsSchema, type DishInput, type FoodMatch } from './items';

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
  // Los alimentos elegidos del catálogo, si el formulario los trae (con un borrador de foto, no).
  const items = ai ? null : parseItems(formData.get('items'));
  if (items === 'invalid') return failure('La lista de alimentos no es válida. Recarga la página.');

  const profile = await getProfile();
  const row = {
    meal_type: mealType,
    description,
    calories_kcal: caloriesKcal,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    eaten_at: zonedToUtcIso(eatenAt, profile.timezone),
    ...(items ? { items } : {}),
  };

  const query = id
    ? supabase.from('macros').update(row).eq('id', id).select('id').single()
    : supabase
        .from('macros')
        .insert({
          ...row,
          source: ai?.source ?? 'manual',
          items: ai?.items ?? items ?? [],
          photo_path: ai?.path ?? null,
          ai_confidence: ai?.confidence ?? null,
          raw_extraction: (ai?.raw ?? null) as Json,
        })
        .select('id')
        .single();
  const { data, error } = await query;
  if (error) return fromDb(error);

  revalidate();
  // Las reglas de dominio no rechazan: avisan (ARCHITECTURE §3.4). Se guarda y se dice. Con alimentos del
  // catálogo no: sus kcal siguen la norma europea (fibra y alcohol incluidos) y no cuadran con Atwater.
  const warning = items?.length ? null : atwaterWarning(caloriesKcal, proteinG, carbsG, fatG);
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

/** `null` si el formulario no trae la lista; `'invalid'` si la trae y no es válida. */
function parseItems(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = MealItemsSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : 'invalid';
  } catch {
    return 'invalid';
  }
}

export type DishResult =
  | { status: 'success'; message: string; dish: Extract<FoodMatch, { kind: 'dish' }> }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

/** Guarda la lista del formulario como plato propio. Devuelve el plato, por ración, para seguir usándolo. */
export async function saveDish(input: DishInput): Promise<DishResult> {
  const parsed = DishFormSchema.safeParse(input);
  if (!parsed.success) {
    const state = fromZod(parsed.error);
    return state.status === 'error' ? state : { status: 'error', message: 'Revisa los campos marcados.' };
  }
  const { name, servings, items } = parsed.data;

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc('create_dish', {
    p_name: name,
    p_servings: servings,
    p_items: items.map((item) => ({ food_id: item.foodId, grams: item.grams })),
  });
  if (error) {
    if (error.code === '23505') {
      return {
        status: 'error',
        message: 'Ya tienes un plato con ese nombre.',
        fieldErrors: { name: 'Elige otro nombre.' },
      };
    }
    const state = fromDb(error);
    return { status: 'error', message: state.status === 'error' ? state.message : 'No se ha podido guardar.' };
  }

  const { data: row, error: readError } = await supabase.from('dishes').select(DISH_SELECT).eq('id', id).single();
  if (readError) return { status: 'error', message: 'El plato se ha guardado, pero no se ha podido leer. Recarga.' };

  revalidatePath('/nutrition');
  return { status: 'success', message: `Plato guardado: búscalo como «${name}».`, dish: dishMatch(row) };
}

export async function deleteDish(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('dishes').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Ese plato ya no existe.');
  revalidatePath('/nutrition');
  return success('Plato borrado. Las comidas que lo usaban conservan sus valores.');
}
