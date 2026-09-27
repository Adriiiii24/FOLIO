import { NextResponse } from 'next/server';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient } from '@/lib/supabase/server';

// Destino de OAuth (Google): canjea el código por una sesión. Flujo PKCE: el verificador está en
// una cookie del mismo navegador que empezó el login, así que aquí siempre coinciden.
// El enlace mágico no pasa por aquí, sino por /auth/confirm, que funciona entre dispositivos.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
