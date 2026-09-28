import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './database.types';

// Las páginas legales se leen sin sesión: Google las revisa antes de publicar el acceso con Google.
const PUBLIC_PATHS = ['/login', '/auth', '/privacidad', '/terminos'];

// En Vercel, Speed Insights puede servir su script bajo una ruta aleatoria que se fija al compilar. El
// matcher es estático y no la conoce: se deja pasar aquí, sin tocar la sesión.
const OBSERVABILITY_BASE_PATH = process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH;

export async function updateSession(request: NextRequest) {
  if (OBSERVABILITY_BASE_PATH && request.nextUrl.pathname.startsWith(OBSERVABILITY_BASE_PATH)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          // Cabeceras anti-caché: una respuesta que fija cookies de sesión no puede cachearla un CDN,
          // o serviría la sesión de un usuario a otro.
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // No meter código entre la creación del cliente y getClaims(): es lo que refresca la sesión.
  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isApi = pathname.startsWith('/api/');

  // Las API responden 401 por su cuenta; solo las páginas redirigen al login.
  if (!data?.claims && !isPublic && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
