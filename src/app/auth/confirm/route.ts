import { NextResponse } from 'next/server';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient } from '@/lib/supabase/server';

// Destino del enlace mágico: verifica el token_hash de la plantilla de correo (supabase/templates).
// A diferencia del ?code= de PKCE, no necesita una cookie del navegador que pidió el enlace, así que
// funciona aunque el correo se abra en el móvil o en el navegador interno de una app de correo.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = safeNextPath(searchParams.get('next'));

  if (tokenHash && type === 'email') {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
