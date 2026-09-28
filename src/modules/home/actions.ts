'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/** La primera vez que se ve el briefing del día: guarda read_at (la cascada de entrada solo ocurre una vez). */
export async function markBriefingRead(id: string): Promise<void> {
  if (!z.uuid().safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from('daily_briefings').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
}
