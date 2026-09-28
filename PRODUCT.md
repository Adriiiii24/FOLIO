# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **El autor**, como usuario real y diario, con el móvil en el gimnasio entre series, en la caja del supermercado y de noche en la cama, y con el escritorio por la mañana para leer el día.
- **Visitantes del portfolio del autor**, unas 10 personas al principio. Llegan al proyecto desde el portfolio, crean su propia cuenta (enlace mágico o Google) y lo usan con sus propios datos. Entran con la cuenta vacía y sin contexto previo, así que lo primero que ven tiene que enseñar a usarlo.

## Product Purpose

FOLIO es un sistema operativo personal que archiva ocho áreas de la vida en un único archivador: inicio, entreno, dinero, diario, nutrición, consumo cultural, hábitos y foco, y configuración. Existe porque la vida cuantificada está repartida entre apps que no se hablan y en las que registrar cuesta demasiado.

Se considera un éxito si registrar cuesta un gesto (≤ 10 s de la foto del ticket al gasto guardado), si los datos de un área explican los de otra (respuestas cruzadas con citas verificables) y si el sistema habla primero cada mañana (briefing diario fiable). Los objetivos medibles están en `docs/PROPOSAL.md` §1.5.

## Positioning

Una sola entrada para ocho dominios, con un solo modelo de datos. La pestaña activa da el contexto y una pestaña por función (registrar, preguntar, foto y voz) separa registrar de preguntar. La IA propone y la persona confirma: ninguna salida de un modelo se guarda sin un borrador visible y editable. Y las cifras del briefing salen de SQL, nunca del modelo.

## Operating Context

- **Uso frecuente y corto:** registrar entre series, en la caja o antes de dormir. Pesa más la velocidad que la exploración.
- **Uso diario y largo:** el briefing de la mañana y las preguntas cruzadas en el chat.
- **Los visitantes** exploran desde el enlace del portfolio con la cuenta vacía.
- **Módulos (pestañas):** `01 // INICIO` · `02 // GIMNASIO` · `03 // FINANZAS` · `04 // DIARIO` · `05 // NUTRICIÓN` · `06 // CULTURA` · `07 // RUTINA` · `08 // AJUSTES`. Las rutas conservan el slug en inglés (`/vault`).
- **El día es siempre el día local de cada usuario** (`profiles.timezone`), nunca el del servidor.

## Capabilities and Constraints

- **Stack:** Next.js 16 (App Router), React 19.3, Tailwind CSS v4, Motion, Supabase (Postgres con RLS, Auth, Storage, pgvector) y Vercel AI SDK. Las versiones exactas están en `docs/ARCHITECTURE.md` §0.
- **Roadmap por fases** (`docs/PROPOSAL.md` §5). La Fase 1 está terminada. La Fase 2 cubre la interfaz y la creación, edición y borrado de datos a mano en los 8 módulos, con la barra de entrada solo para texto. La Fase 3 añade la IA: ingesta multimodal, chat con herramientas y briefing.
- **Multiusuario de verdad:** cada visitante tiene sus datos aislados por RLS (probado con tests) y puede exportarlos y borrar su cuenta.
- **Idioma:** textos en español con tuteo, también las etiquetas de módulo (`03 // FINANZAS`).
- **Despliegue:** Vercel, que el autor conectará al final del proyecto.
- **Decisiones abiertas:**
  - Proveedor de visión y modelo por ruta: se deciden tras el eval, con Claude Opus 5 por defecto.
  - Programación del briefing y PWA.
  - **Presupuesto de IA por visitante.** Hoy vale 25 USD al mes por cuenta; con unas 10 cuentas es demasiado y hay que fijarlo antes de la Fase 3.
  - **Datos de ejemplo:** si cada cuenta nueva puede cargar datos sintéticos para explorar sin registrar nada.

## Brand Commitments

- **Nombre:** FOLIO (así se llama también en GitHub, Supabase y Google Cloud). «DOSSIER_OS» fue el nombre de trabajo de los documentos.
- **Voz:** frases cortas, imperativo, tuteo y cifras concretas. Mayúsculas solo en etiquetas. Los errores dicen qué ha pasado y qué hacer, sin disculpas ni emojis.
- **Sistema de diseño:** `docs/DESIGN_SYSTEM.md` es normativo. La tipografía display es **Helvetica Now Display** (decisión del autor del 2026-09-27; requiere licencia web y archivos que el autor debe aportar y que no pueden ir al repositorio público).

## Evidence on Hand

- Todavía no hay datos reales, testimonios ni benchmark: el benchmark se publica en `docs/BENCHMARK.md` en la Fase 4.
- Los datos de demostración se marcan siempre como sintéticos. No se inventan cifras de rendimiento, clientes ni opiniones.
- **Logotipo** (del autor, 2026-09-28): una carpeta negra abierta sobre naranja `#FD6E01`. La fuente vectorial es `docs/brand/folio-logo.svg`; los iconos de la app están en `src/app` (`icon.svg`, `favicon.ico` y `apple-icon.png`). Dentro de la interfaz, la carpeta va sola en `currentColor` junto a la palabra FOLIO (`FolioMark`).
- La imagen de referencia (`docs/reference/`) es un mockup comercial ajeno. Es solo referencia y nunca se publica.

## Product Principles

1. **La IA propone y tú confirmas.** Toda escritura originada por un modelo pasa por un borrador editable.
2. **Un gesto para registrar.** La acción más frecuente es la más barata. Donde un conmutador basta, no se usa un clasificador.
3. **Las cifras salen de los datos.** Un número que el modelo no puede escribir es un número que no puede inventar.
4. **Datos propios y aislados.** Se pueden exportar y borrar, y nada de una cuenta se ve desde otra.
5. **Sin IA, todo sigue funcionando a mano.**

## Accessibility & Inclusion

WCAG 2.2 AA. Todo se maneja con teclado y el foco siempre se ve. Los atajos de una tecla se pueden desactivar. La app respeta `prefers-reduced-motion` y el modo de colores forzados. Las señales de color van siempre acompañadas de signo y glifo. Los controles miden como mínimo 44 × 44 px. El detalle está en `docs/DESIGN_SYSTEM.md` §8.
