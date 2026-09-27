const BASE = 'http://dossier.invalid';

/**
 * Normaliza el `?next=` de los flujos de login a una ruta interna; cualquier otra cosa cae en `fallback`.
 * Evita redirecciones abiertas (`?next=https://sitio-malicioso`). No basta con comprobar que empieza
 * por `/` y no por `//`: el navegador lee `/\evil.com` y `/\t/evil.com` como `//evil.com`. Por eso se
 * resuelve como lo haría el navegador y se exige que el origen no cambie.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/home'): string {
  if (!next?.startsWith('/')) return fallback;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
