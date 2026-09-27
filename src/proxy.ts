import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next.js 16: antes middleware.ts. Se ejecuta en el runtime de Node.js.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Fuera: estáticos, imágenes y el cron (se autentica con CRON_SECRET, no con sesión).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
