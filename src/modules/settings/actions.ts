'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { AiFormSchema, DELETE_CONFIRMATION, ProfileFormSchema, TargetsFormSchema } from './form';

// La zona horaria y los objetivos cambian cifras en todas las pestañas: se revalida todo el archivador.
function revalidateAll() {
  revalidatePath('/', 'layout');
}

export async function saveProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = ProfileFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');
  const { displayName, timezone, currency } = parsed.data;
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, timezone, currency })
    .eq('id', userId);
  if (error) return fromDb(error);
  revalidateAll();
  return success('Perfil guardado.');
}

export async function saveTargets(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = TargetsFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');
  const values = parsed.data;
  const { error } = await supabase
    .from('profiles')
    .update({
      daily_kcal_target: values.dailyKcalTarget,
      daily_protein_g_target: values.dailyProteinGTarget,
      daily_carbs_g_target: values.dailyCarbsGTarget,
      daily_fat_g_target: values.dailyFatGTarget,
      monthly_budget: values.monthlyBudget,
    })
    .eq('id', userId);
  if (error) return fromDb(error);
  revalidateAll();
  return success('Objetivos guardados.');
}

export async function saveAiSettings(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = AiFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');
  const { error } = await supabase
    .from('profiles')
    .update({ briefing_enabled: parsed.data.briefingEnabled })
    .eq('id', userId);
  if (error) return fromDb(error);
  revalidateAll();
  return success('Ajustes de IA guardados.');
}

/** Cierra la sesión en todos los dispositivos (revoca todos los refresh tokens). */
export async function signOutEverywhere(): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) return failure('No se han podido cerrar las sesiones. Inténtalo de nuevo.');
  redirect('/login');
}

/**
 * Borra la cuenta y, en cascada, todos sus datos (las FK `on delete cascade` de la migración).
 * Excepción consciente a la regla de ARCHITECTURE §2.4 («la clave secreta solo en el job programado»):
 * borrar un usuario de Auth exige la API de administración. Se limita al id de la sesión VERIFICADA
 * (getClaims comprueba la firma del JWT) y nunca acepta un id que venga del cliente.
 */
export async function deleteAccount(_previous: FormState, formData: FormData): Promise<FormState> {
  if (String(formData.get('confirmation') ?? '').trim() !== DELETE_CONFIRMATION) {
    return failure(`Escribe ${DELETE_CONFIRMATION} para confirmar.`, {
      confirmation: `Escribe ${DELETE_CONFIRMATION} en mayúsculas.`,
    });
  }
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');

  const admin = createAdminClient();
  // Archivos de Storage: no cuelgan de auth.users por FK, así que se borran aparte (carpeta {user_id}/).
  for (const bucket of ['receipts', 'meal-photos', 'voice-notes']) {
    const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (files && files.length > 0)
      await admin.storage.from(bucket).remove(files.map((file) => `${userId}/${file.name}`));
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return failure('No se ha podido borrar la cuenta. Inténtalo de nuevo o escribe al autor.');

  await supabase.auth.signOut({ scope: 'local' });
  redirect('/login?cuenta=borrada');
}
