import 'server-only';
import { getAiQuota } from '@/lib/ai/quota';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile, getSessionEmail } from './queries';

export async function getSettingsSheet() {
  const supabase = await createClient();
  const [profile, email, userId] = await Promise.all([getProfile(), getSessionEmail(), requireUserId(supabase)]);
  // Con la IA gratuita el gasto en dólares es 0: lo que limita es el tope diario de usos (lib/ai/quota.ts).
  const quota = userId
    ? await getAiQuota(supabase, userId, profile.timezone)
    : { used: 0, limit: 0, remaining: 0, exceeded: true };

  return {
    profile,
    email,
    aiQuota: quota,
    timeZones: Intl.supportedValuesOf('timeZone'),
  };
}
