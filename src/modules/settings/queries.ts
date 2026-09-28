import 'server-only';
import { cache } from 'react';
import { localDate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';

/** Perfil de la sesión (lo crea el trigger de registro). Una lectura por petición. */
export const getProfile = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) throw new Error(`No se ha podido leer el perfil: ${error.message}`);
  if (!data) throw new Error('Perfil no encontrado');
  return data;
});

/** Zona horaria y día local de hoy: la referencia de todas las consultas por día. */
export const getToday = cache(async () => {
  const profile = await getProfile();
  return { timeZone: profile.timezone, today: localDate(profile.timezone) };
});

/** Email de la sesión, desde las claims verificadas del JWT. */
export const getSessionEmail = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  return typeof email === 'string' ? email : null;
});
