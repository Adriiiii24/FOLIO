# DOSSIER_OS

Proyecto doc-first: el diseño completo está en `docs/`. Fase 1 (Setup & Auth) en curso: pasos locales hechos el 2026-09-27; falta la parte remota.

## Leer antes de trabajar

- `docs/PROPOSAL.md`: producto, las 8 pestañas, arquitectura de IA, roadmap por fases (§5) y decisiones (§4.3, §8).
- `docs/DESIGN_SYSTEM.md`: identidad, tokens de Tailwind v4, componentes y motion. Referencia visual: `docs/reference/referencia-22-98.png`.
- `docs/ARCHITECTURE.md`: migración SQL, RLS, pipeline de IA y estructura de carpetas.

## Reglas

- El código de `docs/` está verificado contra versiones exactas (ARCHITECTURE §0 y §6): next 16.3.6, react 19.3.0, ai 7.0.118, motion 13.4.4, zod 4.6.5, @supabase/ssr 0.12.7 y tailwindcss 4.3.3. No lo «corrijas» con APIs recordadas (`generateObject`, `stepCountIs`, `middleware.ts`, imports de `framer-motion`…): si algo parece raro, compruébalo en `node_modules` o en la documentación oficial antes de cambiarlo.
- Si cambias una versión o un bloque de código de los documentos, vuelve a verificarlo: el SQL, ejecutándolo con la suite pgTAP; el TypeScript, con `tsc --strict`.
- Las decisiones abiertas de PROPOSAL §8 son del usuario; no las tomes por tu cuenta: tipografía display (Space Grotesk frente a Helvetica Now Display, que requiere licencia), modelo por ruta tras el eval (por defecto `claude-opus-5`), Claude frente a Gemini para visión.
- La IA propone y el usuario confirma: ninguna salida de un modelo escribe en tablas de dominio sin un borrador confirmado.
- Textos y documentación en español; las etiquetas de módulo van en inglés (`03 // VAULT`).

## Estado y siguiente paso

Hecho (Fase 1, en local):

- Repo git propio en esta carpeta, rama `main`. El `.gitignore` del home ya ignora FOLIO. `docs/reference/` está fuera del repo.
- Scaffold con create-next-app 16.3.6, generado en una carpeta en minúsculas y movido aquí: con `.`, create-next-app falla en `FOLIO` porque npm no admite mayúsculas en el nombre. Versiones exactas (`.npmrc` con `save-exact`), React 19.3.0 (la plantilla traía 19.2.8), TypeScript 5.9.3 y ESLint 9 (los plugins de `eslint-config-next` aún no admiten ESLint 10).
- Supabase local: migración de ARCHITECTURE §1.3 y `supabase/tests/database/rls.test.sql` con 64 aserciones sobre las 12 tablas, Storage, `anon` y las RPC (64/64).
- Auth: enlace mágico con `token_hash` y `/auth/confirm` (funciona entre dispositivos), Google en `/auth/callback`, `proxy.ts`, grupo `(os)` y `/home` provisional. Probado de extremo a extremo con Playwright y Mailpit.
- CI en `.github/workflows/ci.yml`, ensayada en local.

Siguiente:

- Parte remota de la Fase 1: crear el repo de GitHub (cuenta, visibilidad e identidad de git, pendientes de decidir con el usuario), el proyecto de Supabase (`link` y `db push`), Google OAuth, las plantillas de correo (copiar `supabase/templates/magic_link.html` a «Magic link» y «Confirm signup») y la URL de redirección de las previews, y conectar Vercel.
- Actualizar los docs con lo que cambió al implementar: paso 1 de DESIGN_SYSTEM §9 (`create-next-app .` no funciona aquí), ARCHITECTURE §2.3 (suite ampliada), §2.4 (`/auth/confirm`, `safeNextPath` y el `\\.` del matcher) y §0 (TypeScript 5.9.3).
- Comandos locales: `npm run db:start` (Docker Desktop arrancado), `npm run db:test`, `npm run db:types` tras cada migración y `npm run dev`. Mailpit (correos locales): http://127.0.0.1:54324.
- Para la UI (Fase 2), Impeccable pedirá un `PRODUCT.md`; usa PROPOSAL.md como base.
