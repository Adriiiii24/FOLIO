# DOSSIER_OS

Proyecto doc-first: el diseño completo está en `docs/`. Fase 1 (Setup & Auth) terminada el 2026-09-27; la siguiente es la Fase 2 (UI).

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

Fase 1 (Setup & Auth) terminada a 2026-09-27, salvo la *preview*, que el usuario aplazó (ver abajo). El detalle está en ARCHITECTURE §5 y §6 y en PROPOSAL §5; los docs están en la versión 1.1.

Repo y entorno:

- Repo público `github.com/Adriiiii24/FOLIO`, rama `main`, con remoto `https://Adriiiii24@github.com/...`: el usuario en la URL hace que git use la credencial de esa cuenta.
- Los commits se firman con la identidad local del repo, `Adrián Martínez Panés <184400900+Adriiiii24@users.noreply.github.com>`. La identidad global de git es la del trabajo y no se usa aquí.
- El `.gitignore` del home ya ignora FOLIO. `docs/reference/` está fuera del repo.
- El lockfile debe generarlo npm ≥ 11.19. Con npm 11.6.2 en Windows faltan las dependencias opcionales `@emnapi/*` y `npm ci` falla en Linux. `devEngines` lo avisa con `onFail: "warn"`.
- Hasta que el usuario actualice Node a 24.21 o superior, no uses el npm local para instalar: usa `npx npm@11.19.0 install …`. Después, pasa `devEngines` a `"error"`.
- Supabase local con Docker: `npm run db:start`, `db:test`, `db:types` (tras cada migración) y `npm run dev`. Los correos locales llegan a Mailpit, en http://127.0.0.1:54324.
- `.env.local` apunta al Supabase local y `supabase/.env` guarda las credenciales de Google. Ninguno de los dos se versiona.
- Supabase remoto: proyecto `FOLIO`, ref `chlxyzjrmjwtdnalffme`, eu-west-1, enlazado y con la migración aplicada. `npx supabase test db --linked` pasa 64/64.
- El login interactivo de la CLI no funciona en la terminal del usuario. Usa `supabase login --no-browser` y copia la URL a mano.
- Google OAuth: cliente web del proyecto de Google Cloud `folio-509918`, en modo prueba con el usuario como tester. Está activo en el Supabase local; la CI usa valores ficticios. El usuario pegó el secreto en un chat, así que hay que rotarlo antes de publicar la app.

Decisiones del usuario:

- Vercel se conecta al final del proyecto. El criterio «despliegue de *preview*» de la Fase 1 queda aplazado, y el de la Fase 3 (briefing 7 días seguidos) exigirá tener el cron desplegado.
- La configuración de Auth del proyecto remoto se hace al desplegar: URLs, plantillas de correo, Google y SMTP propio (ARCHITECTURE §5).

Siguiente:

- El usuario tiene que probar a mano el último paso de Google: en `/login`, «Entrar con Google», elegir su cuenta y comprobar que llega a `/home`.
- Fase 2 (UI Folder Tabs & CRUDs), PROPOSAL §5. Antes, el usuario debe decidir la tipografía display (PROPOSAL §8). Impeccable pedirá un `PRODUCT.md`; usa PROPOSAL.md como base.
