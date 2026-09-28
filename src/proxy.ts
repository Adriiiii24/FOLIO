import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next.js 16: antes middleware.ts. Se ejecuta en el runtime de Node.js.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Fuera: estáticos, imágenes, el cron (se autentica con CRON_SECRET, no con sesión) y las rutas de Vercel
  // (script y recogida de Speed Insights), que redirigidas al login devolvían HTML en lugar de JavaScript.
  matcher: ['/((?!_next/static|_next/image|_vercel|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
