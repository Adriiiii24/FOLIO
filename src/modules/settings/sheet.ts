import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getProfile, getSessionEmail } from './queries';

export async function getSettingsSheet() {
  const supabase = await createClient();
  const [profile, email, spend] = await Promise.all([
    getProfile(),
    getSessionEmail(),
    supabase.rpc('ai_spend_this_month'),
  ]);
  if (spend.error) throw new Error(spend.error.message);

  return {
    profile,
    email,
    aiSpend: Number(spend.data ?? 0),
    aiBudget: Number(profile.ai_monthly_budget_usd),
    timeZones: Intl.supportedValuesOf('timeZone'),
  };
}
