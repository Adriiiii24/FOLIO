import 'server-only';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';
import { isDailyQuota, isOverloaded } from './models';
import { getAiQuota } from './quota';

type Profile = Awaited<ReturnType<typeof getProfile>>;
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Mensajes de la fila de estado de la barra: qué ha pasado y qué hacer, sin disculpas (§5.8). */
export const AI_MESSAGE = {
  unauthorized: 'Tu sesión ha caducado. Vuelve a entrar.',
  invalid: 'El archivo no es válido. Vuelve a intentarlo.',
  notFound: 'No se encuentra el archivo subido. Vuelve a intentarlo.',
  overloaded: 'La IA está saturada ahora mismo. Prueba en un minuto o regístralo a mano.',
  dailyQuota: 'La IA gratuita de FOLIO ha llegado a su límite de hoy. Registra a mano; mañana vuelve.',
  photoFailed: 'No se ha podido leer la foto. Prueba con más luz o escríbelo a mano.',
  voiceFailed: 'No se ha podido entender el audio. Prueba otra vez, más cerca del micrófono.',
  quota: (limit: number) => `Has usado los ${limit} usos de IA de hoy. Puedes registrar a mano; mañana se renuevan.`,
} as const;

export const aiFailure = (error: unknown, fallback: string) =>
  isDailyQuota(error) ? AI_MESSAGE.dailyQuota : isOverloaded(error) ? AI_MESSAGE.overloaded : fallback;

/** Sesión, perfil y tope diario antes de cualquier llamada a un modelo. */
export async function beginAiCall(): Promise<
  { ok: true; supabase: Supabase; userId: string; profile: Profile } | { ok: false; message: string }
> {
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return { ok: false, message: AI_MESSAGE.unauthorized };
  const profile = await getProfile();
  const quota = await getAiQuota(supabase, userId, profile.timezone);
  if (quota.exceeded) return { ok: false, message: AI_MESSAGE.quota(quota.limit) };
  return { ok: true, supabase, userId, profile };
}
