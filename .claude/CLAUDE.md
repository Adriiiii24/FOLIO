# FOLIO

Proyecto doc-first: el diseño completo está en `docs/`. «DOSSIER_OS» fue el nombre de trabajo; el producto se llama FOLIO en todas partes. El paquete npm (`dossier-os`) y el `project_id` del Supabase local mantienen el nombre antiguo, porque cambiarlos recrea los contenedores y borra los datos locales. Fases 1 y 2 terminadas a 2026-09-28; la siguiente es la Fase 3 (IA).

## Leer antes de trabajar

- `docs/PROPOSAL.md`: producto, las 8 pestañas, arquitectura de IA, roadmap por fases (§5) y decisiones (§4.3, §8).
- `docs/DESIGN_SYSTEM.md`: identidad, tokens de Tailwind v4, componentes y motion. Su nota de la versión 1.2 recoge lo que cambió al construir. Referencia visual: `docs/reference/referencia-22-98.png`.
- `docs/ARCHITECTURE.md`: migración SQL, RLS, pipeline de IA y estructura de carpetas.
- `PRODUCT.md` (producto y usuarios, para Impeccable) y `DESIGN.md` (sistema visual derivado del build, con `.impeccable/design.json`).

## Reglas

- El código de `docs/` está verificado contra versiones exactas (ARCHITECTURE §0 y §6): next 16.3.6, react 19.3.0, ai 7.0.118, motion 13.4.4, zod 4.6.5, @supabase/ssr 0.12.7 y tailwindcss 4.3.3. No lo «corrijas» con APIs recordadas (`generateObject`, `stepCountIs`, `middleware.ts`, imports de `framer-motion`…): si algo parece raro, compruébalo en `node_modules` o en la documentación oficial antes de cambiarlo.
- Si cambias una versión o un bloque de código de los documentos, vuelve a verificarlo: el SQL, ejecutándolo con la suite pgTAP; el TypeScript, con `tsc --strict`.
- Los bloques de la Fase 3 en ARCHITECTURE (`lib/dates.ts`, `lib/format.ts`, `lib/action-result.ts` y los `actions.ts` de vault, brain y nutrition) se **fusionan** con los archivos de la Fase 2; no los sobrescribas.
- Las decisiones abiertas de PROPOSAL §8 son del usuario; no las tomes por tu cuenta: modelo por ruta tras el eval (por defecto `claude-opus-5`), Claude frente a Gemini para visión y presupuesto de IA por cuenta de visitante.
- La IA propone y el usuario confirma: ninguna salida de un modelo escribe en tablas de dominio sin un borrador confirmado.
- Textos y documentación en español; las etiquetas de módulo van en inglés (`03 // VAULT`).

## Estado y siguiente paso

Fase 1 (Setup & Auth) terminada a 2026-09-27, salvo la *preview*, que el usuario aplazó (ver abajo). Fase 2 (UI y CRUD de las 8 pestañas) terminada a 2026-09-28 con sus criterios cumplidos (PROPOSAL §5). Los docs están en la versión 1.2.

Repo y entorno:

- Repo público `github.com/Adriiiii24/FOLIO`, rama `main`, con remoto `https://Adriiiii24@github.com/...`: el usuario en la URL hace que git use la credencial de esa cuenta.
- Los commits se firman con la identidad local del repo, `Adrián Martínez Panés <184400900+Adriiiii24@users.noreply.github.com>`. La identidad global de git es la del trabajo y no se usa aquí.
- El `.gitignore` del home ya ignora FOLIO. `docs/reference/` está fuera del repo.
- Node 24.19 con npm 11.17. El lockfile debe generarlo npm ≥ 11.17: con npm 11.6.2 en Windows faltan las dependencias opcionales `@emnapi/*` y `npm ci` falla en Linux. `devEngines` lo avisa con `onFail: "warn"`. Se queda en `"warn"` hasta saber qué npm usa Vercel al compilar.
- Supabase local con Docker: `npm run db:start`, `db:test`, `db:types` (tras cada migración) y `npm run dev`. Los correos locales llegan a Mailpit, en http://127.0.0.1:54324. Si cambias plantillas o asuntos en `config.toml`, haz `supabase stop` y `supabase start`.
- Datos de prueba locales: `demo@folio.test` con datos sintéticos y `vacia@folio.test` sin datos. Se entra por enlace mágico con Mailpit.
- `.env.local` apunta al Supabase local y `supabase/.env` guarda las credenciales de Google. Ninguno de los dos se versiona.
- Supabase remoto: proyecto `FOLIO`, ref `chlxyzjrmjwtdnalffme`, eu-west-1, enlazado y con la migración aplicada. `npx supabase test db --linked` pasa 64/64.
- El login interactivo de la CLI no funciona en la terminal del usuario. Usa `supabase login --no-browser` y copia la URL a mano.
- Google OAuth: cliente web del proyecto de Google Cloud `folio-509918`, en modo prueba con el usuario como tester. Está activo en el Supabase local; la CI usa valores ficticios. El usuario pegó el secreto en un chat, así que hay que rotarlo antes de publicar la app.

Decisiones del usuario:

- Usuarios: el autor y los visitantes de su portfolio, cada uno con su cuenta (unas 10 personas al principio).
- Tipografía display: Helvetica Now Display. Faltan la licencia web y los archivos, que no pueden ir al repo público; mientras tanto se usa Inter Tight (`src/app/fonts.ts`). Al cambiarla, recalibra `--numeral-tracking` y `--glyph-em` en `globals.css`.
- Vercel se conecta al final del proyecto. El criterio «despliegue de *preview*» de la Fase 1 queda aplazado, y el de la Fase 3 (briefing 7 días seguidos) exigirá tener el cron desplegado.
- La configuración de Auth del proyecto remoto se hace al desplegar: URLs, plantillas de correo, Google y SMTP propio (ARCHITECTURE §5).

Siguiente:

- El usuario tiene que probar a mano el último paso de Google: en `/login`, «Entrar con Google», elegir su cuenta y comprobar que llega a `/home`.
- Fase 3 (IA y Vector DB), PROPOSAL §5 y ARCHITECTURE §3. Necesita las claves de API de los modelos, que el usuario debe poner en `.env.local` sin pasarlas por el chat. Antes de activar la IA para visitantes, el usuario debe decidir el presupuesto por cuenta (PROPOSAL §8): con los 25 USD por defecto, el peor caso supera los 250 USD al mes.
- En la barra de entrada, `capabilities` (en `QuickInputDock`) activa preguntar, foto y voz cuando exista cada canal.
