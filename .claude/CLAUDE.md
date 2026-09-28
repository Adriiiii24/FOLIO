# FOLIO

Proyecto doc-first: el diseño completo está en `docs/`. «DOSSIER_OS» fue el nombre de trabajo; el producto se llama FOLIO en todas partes. El paquete npm (`dossier-os`) y el `project_id` del Supabase local mantienen el nombre antiguo, porque cambiarlos recrea los contenedores y borra los datos locales. Fases 1 y 2 terminadas a 2026-09-28; la Fase 3 (IA) está construida y probada de punta a punta, pero aún no está cerrada.

## Leer antes de trabajar

- `docs/PROPOSAL.md`: producto, las 8 pestañas, arquitectura de IA, roadmap por fases (§5) y decisiones (§4.3, §8).
- `docs/DESIGN_SYSTEM.md`: identidad, tokens de Tailwind v4, componentes y motion. Sus notas de las versiones 1.2 y 1.3 recogen lo que cambió al construir. Referencia visual: `docs/reference/referencia-22-98.png`.
- `docs/ARCHITECTURE.md`: migración SQL, RLS, pipeline de IA y estructura de carpetas. **Su §3.0 (versión 1.3) manda sobre el resto del §3**, que conserva el diseño previo con Claude.
- `PRODUCT.md` (producto y usuarios, para Impeccable) y `DESIGN.md` (sistema visual derivado del build, con `.impeccable/design.json`).

## Reglas

- El código de `docs/` está verificado contra versiones exactas (ARCHITECTURE §0 y §6): next 16.3.6, react 19.3.0, ai 7.0.118, @ai-sdk/google 4.0.82, motion 13.4.4, zod 4.6.5, @supabase/ssr 0.12.7 y tailwindcss 4.3.3. No lo «corrijas» con APIs recordadas (`generateObject`, `stepCountIs`, `middleware.ts`, imports de `framer-motion`…): si algo parece raro, compruébalo en `node_modules` (la documentación del SDK está en `node_modules/ai/docs`) o en la documentación oficial antes de cambiarlo.
- Si cambias una versión o un bloque de código de los documentos, vuelve a verificarlo: el SQL, ejecutándolo con la suite pgTAP; el TypeScript, con `tsc --strict`.
- Las decisiones abiertas de PROPOSAL §8 son del usuario; no las tomes por tu cuenta: el orden de modelos de cada cadena tras el eval y el tope diario de IA por cuenta.
- La IA propone y el usuario confirma: ninguna salida de un modelo escribe en tablas de dominio sin un borrador confirmado. Esto incluye la voz, que en el diseño previo guardaba la nota sin confirmar.
- Textos y documentación en español; las etiquetas de módulo van en inglés (`03 // VAULT`).
- Al editar archivos con scripts de Python, usa cadenas crudas (`r'...'`) para las expresiones regulares: `\b` se convierte en un retroceso y rompe la regex sin error visible.

## Estado y siguiente paso

Fase 1 (Setup & Auth) terminada a 2026-09-27, salvo la *preview*, que el usuario aplazó (ver abajo). Fase 2 (UI y CRUD de las 8 pestañas) terminada a 2026-09-28 con sus criterios cumplidos. Fase 3 (IA) construida a 2026-09-28 (PROPOSAL §5, ARCHITECTURE §3.0); los docs están en la versión 1.3.

Repo y entorno:

- Repo público `github.com/Adriiiii24/FOLIO`, rama `main`, con remoto `https://Adriiiii24@github.com/...`: el usuario en la URL hace que git use la credencial de esa cuenta.
- Los commits se firman con la identidad local del repo, `Adrián Martínez Panés <184400900+Adriiiii24@users.noreply.github.com>`. La identidad global de git es la del trabajo y no se usa aquí.
- El `.gitignore` del home ya ignora FOLIO. `docs/reference/` está fuera del repo.
- Node 24.19 con npm 11.17. El lockfile debe generarlo npm ≥ 11.17: con npm 11.6.2 en Windows faltan las dependencias opcionales `@emnapi/*` y `npm ci` falla en Linux. `devEngines` lo avisa con `onFail: "warn"`. Se queda en `"warn"` hasta saber qué npm usa Vercel al compilar.
- Supabase local con Docker: `npm run db:start`, `db:test`, `db:types` (tras cada migración) y `npm run dev`. Los correos locales llegan a Mailpit, en http://127.0.0.1:54324. Si cambias plantillas o asuntos en `config.toml`, haz `supabase stop` y `supabase start`.
- Datos de prueba locales: `demo@folio.test` con datos sintéticos y `vacia@folio.test` sin datos. Se entra por enlace mágico con Mailpit.
- `.env.local` apunta al Supabase local y lleva `GOOGLE_GENERATIVE_AI_API_KEY`; `supabase/.env` guarda las credenciales de Google OAuth. Ninguno de los dos se versiona. No edites `.env.local`: para pruebas, pasa variables al arrancar (`AI_DAILY_LIMIT=500 CRON_SECRET=... npm run dev`).
- Supabase remoto: proyecto `FOLIO`, ref `chlxyzjrmjwtdnalffme`, eu-west-1, enlazado y con la migración aplicada. `npx supabase test db --linked` pasa 64/64.
- El login interactivo de la CLI no funciona en la terminal del usuario. Usa `supabase login --no-browser` y copia la URL a mano.
- Google OAuth: cliente web del proyecto de Google Cloud `folio-509918`, en modo prueba con el usuario como tester. Está activo en el Supabase local; la CI usa valores ficticios. El usuario pegó el secreto en un chat, así que hay que rotarlo antes de publicar la app.

IA gratuita (Gemini), lo que hay que saber:

- **Cuota:** 20 peticiones al día por modelo y por PROYECTO en `gemini-3.8-flash` y `gemini-3.6-flash` (medido; `GenerateRequestsPerDayPerProjectPerModel-FreeTier`). Se reinicia a medianoche de la hora del Pacífico, las 09:00 en Madrid. No la gastes en pruebas: usa el eval con pocos modelos y los datos de `evals/fixtures`.
- **Saturación:** el nivel gratuito devuelve 503 a menudo. `src/lib/ai/models.ts` encadena seis modelos, deja en reposo los agotados (hasta el reinicio) y los saturados (30 s), y lanza `AiUnavailableError` si no queda ninguno.
- **Razonamiento:** `thinkingLevel: 'minimal'` da un 400 en `gemini-3.8-flash`; usa `'low'` o superior.
- **Tope por persona:** `src/lib/ai/quota.ts`, `AI_DAILY_LIMIT` (20, provisional). Cuenta las filas de `ai_runs` del día local, sin embeddings ni briefing.
- **Límites reales de cada modelo:** el usuario puede verlos en aistudio.google.com/rate-limit.

Decisiones del usuario:

- Usuarios: el autor y los visitantes de su portfolio, cada uno con su cuenta (unas 10 personas al principio).
- Tipografía display: Helvetica Now Display. Faltan la licencia web y los archivos, que no pueden ir al repo público; mientras tanto se usa Inter Tight (`src/app/fonts.ts`). Al cambiarla, recalibra `--numeral-tracking` y `--glyph-em` en `globals.css`.
- **La IA tiene que ser gratis** (2026-09-28): nivel gratuito de la Gemini API en un proyecto de Google Cloud sin facturación (en AI Studio, la columna «Plan» no debe decir «Paid»). Desde el EEE, Google no usa esos datos para entrenar.
- Vercel se conecta al final del proyecto. El criterio «despliegue de *preview*» de la Fase 1 queda aplazado, y el de la Fase 3 (briefing 7 días seguidos) exigirá tener el cron desplegado.
- La configuración de Auth del proyecto remoto se hace al desplegar: URLs, plantillas de correo, Google y SMTP propio (ARCHITECTURE §5).

Siguiente:

1. **Línea base del eval** (criterio de salida de la Fase 3), con la cuota recién reiniciada: `EVAL_MODELS=gemini-3.8-flash,gemini-3.5-flash-lite npm run eval`. Guarda `evals/results/<fecha>.json`; versiónalo y resúmelo en PROPOSAL §5.
2. **Decisiones del usuario** (PROPOSAL §8), con el eval y los límites reales delante: el tope diario por cuenta y el orden de modelos.
3. **Revisión de Impeccable** de las superficies nuevas (chat, briefing, borrador con confianza, barra con iconos en móvil) y documentador (`DESIGN.md`).
4. **Pendientes técnicos:**
   - Sustituir los bloques del §3 de ARCHITECTURE por el código real (`check-blocks` da 23 distintos, todos del diseño previo).
   - Opcional: botón «Generar el briefing de hoy» en HOME. Hoy solo lo genera el cron, y los visitantes no lo verían hasta el día siguiente. Necesitaría el cliente administrativo, porque `daily_briefings` no admite INSERT con sesión.
5. El usuario tiene que probar a mano el último paso de Google: en `/login`, «Entrar con Google», elegir su cuenta y comprobar que llega a `/home`.
6. Fase 4 (evals completos, `BENCHMARK.md`) y despliegue en Vercel al final, con el cron de `vercel.json`.
