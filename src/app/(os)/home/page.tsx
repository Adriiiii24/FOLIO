import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Inicio' };

// Lámina provisional: demuestra la sesión y la lectura con RLS (solo devuelve el perfil propio).
export default async function HomePage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('display_name, timezone').maybeSingle();

  return (
    <main className="flex flex-col gap-2 p-4">
      <h1 className="font-mono text-sm">
        <span lang="en">01 // HOME</span>
      </h1>
      <p>Hola, {profile?.display_name ?? 'sin nombre'}.</p>
      <p className="text-sm">Zona horaria: {profile?.timezone ?? '—'}</p>
    </main>
  );
}
