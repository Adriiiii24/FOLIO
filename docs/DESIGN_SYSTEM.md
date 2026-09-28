# FOLIO — Design System

> **Documento:** `DESIGN_SYSTEM.md` · **Versión:** 1.2 · **Estado:** Fase 2 implementada (1.0 y 1.1: especificación doc-first) · **Fecha:** 2026-09-28
> **Documentos hermanos:** [`PROPOSAL.md`](./PROPOSAL.md) (producto) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) (datos, IA, carpetas)
> **Stack de UI:** Next.js 16 · React 19.3 · Tailwind CSS 4.3 · Motion 13 (`motion/react`) · `next/font`

> [!NOTE]
> **Verificado el 2026-09-27:** el `globals.css` de §2.7 compila con Tailwind 4.3.3 y genera todas las utilidades que usan los componentes (la sombra contextual sale como `4px 4px 0 0 var(--shadow-ink)`, resuelta en cada elemento). Todos los componentes TSX compilan con `tsc --strict` contra Next.js 16.3.6, React 19.3.0 y Motion 13.4.4. Los contrastes de §2.3 y la curva `--ease-sheet` están calculados, no estimados. Falta verlo renderizado en navegadores reales.

> [!IMPORTANT]
> **Versión 1.2 (2026-09-28): lo que cambió al construir la Fase 2.** Los bloques de código de este documento se copian ahora del repositorio, que manda: `globals.css`, `fonts.ts`, `tabs.ts`, el layout del archivador, `FolderTabs`, `TabShortcuts`, `Sheet`, `BrutalistCard`, `DisplayNumeral`, `DeltaChip`, `QuickInputBar`, los tokens de motion y `MotionProvider`. El detalle visual derivado de lo construido está en `DESIGN.md`, en la raíz. Las reglas de este documento siguen siendo normativas; se desvían en estos puntos, todos verificados en el navegador:
>
> - **Tipografía display:** el autor eligió Helvetica Now Display (§3.1). Hasta tener la licencia y los `.woff2`, que no pueden ir al repositorio público, Inter Tight hace de sustituto.
> - **Cifra protagonista (§5.5):** ocupa el ancho de su contenedor según su número de caracteres (`--chars`), con 15rem de tope. El tope de `--text-display` la dejaba en 72 px en móvil. Con Inter Tight el tracking es −0,03em, porque con −0,055em se tocaban las cifras («11»); hay que recalibrarlo con Helvetica. Lleva `padding-block-end: 0.1em` para que los descendentes no pisen la línea siguiente.
> - **Pestañas en móvil (§5.2):** todas muestran su nombre, no solo el índice. Los visitantes llegan sin contexto y un «05» suelto no dice qué carpeta es. La tira se desplaza sola para enseñar la activa, sin `scrollIntoView`, que movía el punto de partida del tabulador. Con `forced-colors`, las pestañas llevan borde y la activa se pinta en `Highlight`.
> - **Rejilla del archivador (§5.1):** `grid-cols-[minmax(0,1fr)]`. Sin ese mínimo, la tira de pestañas ensanchaba la página a 464–513 px en un móvil de 390.
> - **Barra de entrada (§5.6):** la prop `capabilities` apaga `PREGUNTAR`, `FOTO` y `VOZ` hasta que exista la IA de la Fase 3. Mientras tanto, la barra es solo de texto, con un analizador determinista, y el botón principal es siempre `ENVIAR`. El interruptor dice «Preguntar», sin el glifo «?». Lo escrito solo se borra cuando se guarda.
> - **Borrador (§5.7):** las acciones van en un pie fijo (`sticky`) dentro del papel, para que `GUARDAR` se vea sin desplazarse. Descartar devuelve el texto a la barra y Escape también descarta. `DESHACER` dura 5 s. Todavía no hay campo de confianza ni gesto de arrastre: llegan con la IA.
> - **Controles de formulario:** clases `.control`, `.field-label`, `.field-hint` y `.field-error`, con variantes para `paper`. En papel, el botón principal no lleva sombra: sin el naranja detrás, la sombra negra sobre blanco ensuciaba.
> - **`DeltaChip`:** anima con `requestAnimationFrame` en lugar de un estado dentro de un efecto, que prohíben las reglas de React 19.

---

## Índice

0. [Cómo usar este documento](#0-cómo-usar-este-documento)
1. [Identidad visual & concepto](#1-identidad-visual--concepto)
2. [Design Tokens & Palette](#2-design-tokens--palette)
3. [Tipografía & jerarquía](#3-tipografía--jerarquía)
4. [Layout y rejilla](#4-layout-y-rejilla)
5. [Component Specs](#5-component-specs)
6. [Motion System](#6-motion-system)
7. [Datos y gráficos](#7-datos-y-gráficos)
8. [Accesibilidad](#8-accesibilidad)
9. [Guía de implementación paso a paso](#9-guía-de-implementación-paso-a-paso)
10. [Checklist de revisión](#10-checklist-de-revisión)

---

## 0. Cómo usar este documento

- Las **reglas y los tokens son normativos**: si el código los contradice, el código está mal. Los bloques de código son implementaciones de referencia listas para copiar.
- Cada componente indica su ruta final (coherente con la estructura de [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4).
- Si más adelante se genera un `DESIGN.md` a partir de la UI construida, este documento hace de brief: fija lo que no se negocia (paleta, superficies, metáfora, física del movimiento).

---

## 1. Identidad visual & concepto

### 1.1 Lectura de la referencia

<img src="./reference/referencia-22-98.png" alt="Referencia visual: campo naranja arriba, bloque negro abajo con la cifra 22‘98 a todo el ancho" width="215">

La referencia visual (archivo local, fuera del repositorio público) es un póster digital: un campo naranja saturado que ocupa media pantalla, un bloque negro anclado abajo, una cifra blanca gigantesca (`22‘98`) a todo el ancho, microtipografía en mayúsculas en las esquinas, un único punto naranja sobre el negro y tres etiquetas repartidas en la base (`HOME`, `CATALOG`, `CHART`).

| Elemento de la referencia | Traducción en FOLIO |
|---|---|
| Campo naranja que domina la mitad superior | **`canvas`**: la mesa del archivador. Siempre visible como banda superior (barra de sistema + pestañas) y como marco en escritorio |
| Bloque negro anclado | **`folder`**: la carpeta abierta, que ocupa el área de trabajo |
| Cifra gigante a todo el ancho | **`DisplayNumeral`**: una cifra protagonista por lámina, a tamaño cartel |
| Microtipografía en las esquinas | `SystemBar` y filas de metadatos en mono de 11 px |
| Punto naranja sobre negro | **Punto de estado**: fijo cuando el sistema está en línea, pulsa al grabar o cuando la IA trabaja |
| Etiquetas repartidas a izquierda, centro y derecha | Fila de etiquetas bajo la cifra, alineada a los bordes de la rejilla |

| No se toma | Por qué |
|---|---|
| El degradado vertical del naranja | Contradice la regla de superficies opacas y planas, y convierte cada contraste en una incógnita |
| Los caracteres chinos decorativos | Texto sin significado para quien usa el producto. Aquí cada rótulo dice algo |
| La composición estática de póster | FOLIO es una herramienta de uso diario: la cifra **abre** la lámina y el resto se desplaza por debajo |

### 1.2 La metáfora: cuatro superficies físicas

```text
┌──────────────────────────────────────────────┐  canvas  · #FF3B00 · la mesa del archivador
│  FOLIO                 DOM 27·09   ● EN LÍNEA │
│  ┌01┐ ┌02┐ ┌03 // VAULT┐ ┌04┐ ┌05┐ ┌06┐ …     │  pestañas: la de delante está izada y es negra
├──┴──┴─┴──┴─┘           └─┴──┴─┴──┴─┴──┴───────┤
│  folder · #000000 · la carpeta abierta        │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ ficha · #121212  │  │ ficha · #121212  │   │  fichas: lo que se archiva dentro
│  └──────────────────┘  └──────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │ paper · #FFFFFF · lo que escribes o    │   │  papel: la entrada y lo pendiente de decidir
│  │ decides (barra de entrada, borradores) │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

| Superficie | Qué es | Color | Regla de uso |
|---|---|---|---|
| `canvas` | La mesa sobre la que está el archivador | `#FF3B00` | Solo marco y banda superior. Nunca contenido largo encima |
| `folder` | La carpeta abierta | `#000000` | Fondo del área de trabajo |
| Ficha | Lo archivado dentro de la carpeta | `#121212` | Tarjetas de datos (`BrutalistCard`) |
| `paper` | Lo que se escribe o se decide | `#FFFFFF` | Solo la `QuickInputBar` y los borradores de IA pendientes de confirmar |

> [!TIP]
> **El papel blanco significa «te toca a ti».** Como solo lo llevan la barra de entrada y los borradores que esperan confirmación, el blanco se convierte en una señal: si ves papel, hay algo que escribir o decidir.

### 1.3 Filosofía: diez reglas

1. **Superficies opacas y planas.** Cero degradados, cero transparencias, cero desenfoques. Un gris es un gris opaco, nunca blanco al 60 %.
2. **Bordes de 0 o 2 px.** No existe otro grosor.
3. **Radio 0.** La única excepción es el punto de estado, que es un círculo.
4. **Sombras solo duras:** sin desenfoque, desplazadas 2, 4 o 6 px, en la *tinta de sombra* de la superficie de debajo (§2.4).
5. **Una cifra protagonista por lámina**, a tamaño cartel.
6. **Jerarquía por tamaño y peso, no por color.** El naranja nunca decora: significa *aquí, activo o en vivo*.
7. **Todo alinea** a la rejilla de columnas y a la base de 4 px.
8. **Mayúsculas solo en etiquetas** de tres palabras como máximo; nunca en párrafos.
9. **El color no se anima; el espacio sí.** Los cambios de estado de color son instantáneos (como un interruptor); los desplazamientos siguen física de muelle.
10. **Todo control mide al menos 44 × 44 px** y se puede usar con una mano.

### 1.4 Presupuesto de expresión

FOLIO es una superficie de **operación**: quien la usa viene a completar una tarea (registrar, consultar, decidir). La identidad vive en los detalles precisos y nunca puede tapar la tarea.

| Recurso | Límite por lámina |
|---|---|
| Cifra protagonista (`DisplayNumeral`) | 1 |
| Naranja dentro de la carpeta | Solo estado: activo, foco, en vivo (grabando, procesando) y la sombra de lo pulsable |
| Sombras duras | Solo en lo que se puede pulsar o está pendiente de decisión |
| Microtipografía (mono 11 px) | 2 bloques como máximo |
| Animaciones en la entrada de la lámina | La transición de la lámina y nada más (§6.5) |

### 1.5 Por qué oscuro

**Escena física:** quien usa FOLIO lo abre a las 07:00 para leer el briefing, apunta series entre repeticiones bajo la luz del gimnasio, fotografía tickets en la caja del supermercado y dicta el diario de noche, en la cama.

Consecuencias: el área de trabajo es negra (uso nocturno, pantallas OLED), el naranja se limita a una banda y un marco para no deslumbrar, y cada acción frecuente cabe bajo el pulgar. Hay **un solo tema**: el sistema no ofrece modo claro porque la identidad *es* esta relación naranja-negro.

---

## 2. Design Tokens & Palette

### 2.1 Arquitectura de tokens

| Nivel | Qué contiene | Dónde vive |
|---|---|---|
| **Primitivos** | Colores, escala tipográfica, curvas, duraciones | `@theme` con valores literales en `src/app/globals.css` |
| **Contextuales** | Tinta de sombra (`--shadow-ink`) y color de foco (`--focus-ring`), que dependen de la superficie de debajo | Reglas `[data-surface]` + `@theme inline` |
| **De componente** | Composición de los anteriores | Clases de cada componente |

> [!IMPORTANT]
> **Colores con hex literal en `@theme`, nunca en `@theme inline` con `var()`.** Con indirección, Tailwind no puede calcular el `color-mix` de los modificadores de opacidad (`text-white/70` sale sin opacidad). El sistema no usa transparencias, pero la regla evita sorpresas. `@theme inline` se reserva para fuentes y sombras contextuales: sin `inline`, la utilidad referenciaría `var(--shadow-hard)` resuelta en `:root`, y redefinir `--shadow-ink` en una superficie no tendría ningún efecto. Y el bloque de primitivos es `@theme static`, porque Tailwind solo emite por defecto las variables que usan sus utilidades.

### 2.2 Paleta

| Token | Hex | Utilidades | Rol | Nunca |
|---|---|---|---|---|
| `brand-orange` | `#FF3B00` | `bg-brand-orange`, `text-brand-orange` | `canvas`; estado activo, foco y «en vivo» dentro de la carpeta; sombra de lo pulsable | Texto blanco pequeño encima (3,57:1); significar «negativo» |
| `black` | `#000000` | `bg-black`, `text-black` | `folder`; texto sobre `canvas` y `paper` | — |
| `white` | `#FFFFFF` | `bg-white`, `text-white` | Texto sobre `folder`; superficie `paper` | Fondo de fichas |
| `structure` | `#121212` | `bg-structure` | Fichas dentro de la carpeta | Texto |
| `line` | `#2A2A2A` | `border-line`, `divide-line` | Divisores decorativos sobre oscuro | Bordes de controles (1,31:1, no cumple 3:1) |
| `steel` | `#6B6B6B` | `border-steel`, `text-steel` | Bordes de controles sobre oscuro; texto secundario sobre `paper` | Texto sobre oscuro (3,52:1) |
| `ash` | `#8A8A8A` | `text-ash` | Texto secundario sobre `folder` y fichas | Texto sobre `paper` |
| `signal-up` | `#00E08A` | `text-signal-up`, `border-signal-up` | Cambio favorable | Decoración; ir sin glifo |
| `signal-down` | `#FF2D55` | `text-signal-down`, `border-signal-down` | Cambio desfavorable, error | Decoración; ir sin glifo |
| `signal-warn` | `#FFD400` | `text-signal-warn`, `border-signal-warn` | Aviso: umbral cerca, confianza baja | Decoración |

> [!NOTE]
> **Por qué `signal-down` no es el naranja de marca.** `#FF3B00` es un naranja rojizo. Si «negativo» se pintara con el color de la marca, la marca entera se leería como alarma. `signal-down` (`#FF2D55`) tira hacia el rosa para separarse del naranja, y aun así **nunca va solo**: siempre acompañado de signo (`+`/`−`) y glifo (`▲`/`▼`), porque rojo y verde se confunden con deuteranopía.

### 2.3 Contraste medido (WCAG 2.2)

Calculado con la fórmula de luminancia relativa de WCAG, no estimado.

| Primer plano | Fondo | Ratio | Texto normal (4,5:1) | Texto grande y UI (3:1) |
|---|---|---|---|---|
| `#FFFFFF` | `#000000` | 21,00 | ✓ | ✓ |
| `#FFFFFF` | `#121212` | 18,73 | ✓ | ✓ |
| `#000000` | `#FF3B00` | 5,88 | ✓ | ✓ |
| `#FFFFFF` | `#FF3B00` | **3,57** | ✗ | ✓ solo ≥ 24 px, o ≥ 18,66 px en negrita |
| `#FF3B00` | `#000000` | 5,88 | ✓ | ✓ |
| `#FF3B00` | `#121212` | 5,24 | ✓ | ✓ |
| `#FF3B00` | `#FFFFFF` | 3,57 | ✗ | ✓ (anillos, no texto) |
| `#8A8A8A` (`ash`) | `#000000` | 6,08 | ✓ | ✓ |
| `#8A8A8A` (`ash`) | `#121212` | 5,43 | ✓ | ✓ |
| `#6B6B6B` (`steel`) | `#121212` | 3,52 | ✗ | ✓ (bordes de controles) |
| `#6B6B6B` (`steel`) | `#FFFFFF` | 5,33 | ✓ | ✓ |
| `#2A2A2A` (`line`) | `#121212` | 1,31 | ✗ | ✗ (solo decorativo) |
| `#00E08A` | `#121212` | 10,73 | ✓ | ✓ |
| `#FF2D55` | `#121212` | 5,14 | ✓ | ✓ |
| `#FFD400` | `#121212` | 13,09 | ✓ | ✓ |

**Regla derivada:** sobre `canvas`, el texto es **negro**. El blanco sobre naranja solo se admite a partir de 24 px (o 18,66 px en negrita).

### 2.4 Superficies contextuales

La sombra dura y el anillo de foco se dibujan *fuera* del elemento, sobre la superficie de debajo. Por eso su color lo decide la superficie **para lo que se apoya encima**, no para sí misma. Así lo resuelve una sola regla CSS por superficie, `[data-surface="…"] > *`.

| Superficie | Fondo / texto | `--shadow-ink` para sus hijos | `--focus-ring` para sus hijos |
|---|---|---|---|
| `canvas` | `#FF3B00` / `#000000` | `#000000` (la sombra del brief, `4px 4px 0 #000`) | `#000000` |
| `folder` | `#000000` / `#FFFFFF` | `#FF3B00` | `#FF3B00` |
| `paper` | `#FFFFFF` / `#000000` | `#000000` | `#000000` |

> [!IMPORTANT]
> **`box-shadow: 4px 4px 0 #000` no se ve sobre negro.** La sombra negra del brief funciona sobre el naranja y sobre el papel; dentro de la carpeta se invierte a naranja y se lee como el lienzo asomando bajo una ficha desplazada. Por eso la sombra es un token contextual y no un valor fijo.

### 2.5 Señales de estado

El color de un cambio depende de **la dirección y de si subir es bueno** en esa métrica.

| Métrica | Sube | Baja |
|---|---|---|
| Gasto (`VAULT`) | `▲ +12,40 €` en `signal-down` | `▼ −12,40 €` en `signal-up` |
| Volumen de entreno (`GYM`) | `▲` en `signal-up` | `▼` en `signal-down` |
| Kcal frente al objetivo (`NUTRITION`) | Por encima del objetivo: `signal-warn` | Dentro del objetivo: sin color |
| Racha (`ROUTINE`) | `signal-up` | Racha rota: `signal-down` |

### 2.6 Espaciado, bordes, sombras y capas

| Categoría | Valores | Notas |
|---|---|---|
| Base de espaciado | 4 px (`--spacing: 0.25rem`, el valor por defecto de Tailwind) | Ritmo vertical en múltiplos de 8 px |
| Bordes | `border-0` · `border-2` | Ningún otro grosor |
| Radios | Ninguno | La escala de radios se elimina; solo `rounded-full` para el punto de estado |
| Sombras | `shadow-hard-sm` 2 px · `shadow-hard` 4 px · `shadow-hard-lg` 6 px · `shadow-none` | Siempre en `--shadow-ink`; la escala suave de Tailwind se elimina |
| Capas (`z-index`) | 0 lámina · 1 pestaña activa · 30 barra de entrada · 50 avisos (*toasts*) · 60 diálogos | — |

### 2.7 `globals.css` completo

Ruta: `src/app/globals.css`.

```css
@import 'tailwindcss';

/* ─────────────────────────────────────────────────────────────────
   1 · PRIMITIVOS — valores literales (sin `inline`).
   `static`: Tailwind solo emite las variables que usan sus utilidades, y el CSS
   propio de este archivo (pestañas, View Transitions) lee varias con var().
   ───────────────────────────────────────────────────────────────── */
@theme static {
  /* Solo existen los colores del sistema: no hay bg-blue-500 que usar por despiste. */
  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;

  --color-brand-orange: #ff3b00;
  --color-black: #000000;
  --color-white: #ffffff;
  --color-structure: #121212;
  --color-line: #2a2a2a;
  --color-steel: #6b6b6b;
  --color-ash: #8a8a8a;
  --color-signal-up: #00e08a;
  --color-signal-down: #ff2d55;
  --color-signal-warn: #ffd400;

  /* Sin radios y sin sombras suaves: el brutalismo no se negocia por despiste. */
  --radius-*: initial;
  --shadow-*: initial;

  /* Escala tipográfica cerrada (ver §3.3). */
  --text-*: initial;
  --text-display: clamp(4.5rem, 17vw, 15rem);
  --text-display--line-height: 0.82;
  --text-display--letter-spacing: -0.055em;
  --text-headline: clamp(2.25rem, 5vw, 4rem);
  --text-headline--line-height: 0.95;
  --text-headline--letter-spacing: -0.03em;
  --text-title: 1.5rem;
  --text-title--line-height: 1.15;
  --text-title--letter-spacing: -0.01em;
  --text-body: 1rem;
  --text-body--line-height: 1.5;
  --text-small: 0.875rem;
  --text-small--line-height: 1.45;
  --text-label: 0.75rem;
  --text-label--line-height: 1.2;
  --text-label--letter-spacing: 0.08em;
  --text-micro: 0.6875rem;
  --text-micro--line-height: 1.2;
  --text-micro--letter-spacing: 0.1em;

  /* Curvas (§6.2). --ease-sheet es el spring 300/30 muestreado; se regenera con scripts/spring-to-linear.ts. */
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-sheet: linear(
    0 0%,
    0.049 5%,
    0.161 10%,
    0.297 15%,
    0.435 20%,
    0.561 25%,
    0.669 30%,
    0.758 35%,
    0.829 40%,
    0.883 45%,
    0.923 50%,
    0.952 55%,
    0.972 60%,
    0.985 65%,
    0.994 70%,
    1 75%,
    1.003 80%,
    1.004 85%,
    1.004 90%,
    1.004 95%,
    1 100%
  );

  --animate-rec-pulse: rec-pulse 1.2s var(--ease-in-out-strong) infinite;
  --animate-caret-blink: caret-blink 1s steps(1) infinite;

  @keyframes rec-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.35);
      opacity: 0.6;
    }
  }
  @keyframes caret-blink {
    50% {
      opacity: 0;
    }
  }
}

/* ─────────────────────────────────────────────────────────────────
   2 · CONTEXTUALES — `inline` para que var() se resuelva en el elemento
   ───────────────────────────────────────────────────────────────── */
@theme inline {
  --font-display: var(--font-display-face), 'Arial Narrow', Arial, sans-serif;
  --font-sans: var(--font-sans-face), system-ui, sans-serif;
  --font-mono: var(--font-mono-face), ui-monospace, monospace;

  --shadow-hard-sm: 2px 2px 0 0 var(--shadow-ink);
  --shadow-hard: 4px 4px 0 0 var(--shadow-ink);
  --shadow-hard-lg: 6px 6px 0 0 var(--shadow-ink);
  --shadow-none: 0 0 #0000;
}

/* ─────────────────────────────────────────────────────────────────
   3 · BASE Y SUPERFICIES
   ───────────────────────────────────────────────────────────────── */
@layer base {
  :root {
    --shadow-ink: var(--color-black);
    --focus-ring: var(--color-black);
    --sheet-offset: 32px;
    --duration-press: 100ms;
    --duration-fast: 160ms;
    --duration-base: 240ms;
    --duration-exit: 200ms;
    --duration-sheet: 400ms;
    --quick-bar-height: 96px;
  }

  html {
    /* El fondo va SOLO en html: con fondo opaco en html y en body a la vez,
       cualquier hijo con z-index negativo queda tapado por el fondo de body. */
    background: var(--color-brand-orange);
    color: var(--color-black);
    font-family: var(--font-sans-face), system-ui, sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-text-size-adjust: 100%;
    /* El foco nunca queda escondido bajo la barra de entrada fija (WCAG 2.4.11). */
    scroll-padding-bottom: calc(var(--quick-bar-height) + env(safe-area-inset-bottom));
  }

  [data-surface='canvas'] {
    background: var(--color-brand-orange);
    color: var(--color-black);
  }
  [data-surface='folder'] {
    background: var(--color-black);
    color: var(--color-white);
  }
  [data-surface='paper'] {
    background: var(--color-white);
    color: var(--color-black);
  }

  /* La superficie define la tinta para lo que se apoya ENCIMA, no para sí misma. */
  [data-surface='canvas'] > * {
    --shadow-ink: var(--color-black);
    --focus-ring: var(--color-black);
  }
  [data-surface='folder'] > * {
    --shadow-ink: var(--color-brand-orange);
    --focus-ring: var(--color-brand-orange);
  }
  [data-surface='paper'] > * {
    --shadow-ink: var(--color-black);
    --focus-ring: var(--color-black);
  }

  :focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  ::selection {
    background: var(--color-brand-orange);
    color: var(--color-black);
  }

  @media (max-width: 47.99rem) {
    :root {
      --sheet-offset: 24px;
    }
  }
}

/* ─────────────────────────────────────────────────────────────────
   4 · COMPONENTES — ver §5 para la especificación de cada uno
   ───────────────────────────────────────────────────────────────── */
@layer components {
  /* §5.2 FolderTabs */
  .folder-tabs {
    padding-inline: 16px;
  }
  .folder-tabs__list {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 4px;
  }
  .folder-tabs__list > li {
    display: flex;
  }

  .folder-tab {
    --tab-rise: 0px; /* 0 inactiva · 4px hover · 8px activa */
    --tab-fill: var(--color-brand-orange);
    --tab-ink: var(--color-black);
    position: relative;
    isolation: isolate;
    display: flex;
    flex: 1;
    align-items: flex-end;
    height: 48px; /* caja fija: el área táctil nunca cambia */
    padding: 0 14px 10px;
    color: var(--tab-ink);
    text-decoration: none;
  }
  /* Dos capas recortadas: contorno negro y relleno desplazado 2 px hacia dentro. */
  .folder-tab::before,
  .folder-tab::after {
    content: '';
    position: absolute;
    z-index: -1;
    clip-path: polygon(
      10px calc(8px - var(--tab-rise)),
      calc(100% - 10px) calc(8px - var(--tab-rise)),
      100% 100%,
      0 100%
    );
    transition: clip-path var(--duration-fast) var(--ease-out-strong);
  }
  .folder-tab::before {
    inset: 0;
    background: var(--color-black);
  }
  .folder-tab::after {
    inset: 2px 2px 0;
    background: var(--tab-fill);
  }

  .folder-tab__label {
    display: flex;
    gap: 0.5ch;
    font-family: var(--font-mono-face), ui-monospace, monospace;
    font-size: var(--text-label);
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    translate: 0 calc(var(--tab-rise) * -1);
    transition: translate var(--duration-fast) var(--ease-out-strong);
  }

  @media (hover: hover) and (pointer: fine) {
    .folder-tab:not([aria-current='page']):hover {
      --tab-rise: 4px;
    }
  }
  .folder-tab:not([aria-current='page']):active {
    --tab-rise: 2px;
  }

  .folder-tab[aria-current='page'] {
    --tab-rise: 8px;
    --tab-fill: var(--color-black);
    --tab-ink: var(--color-white);
    z-index: 1;
    margin-bottom: -2px; /* se funde con la carpeta: sin costura */
  }

  /* < 1024 px: la tira desliza en horizontal con snap; cada pestaña conserva su nombre (ver abajo). */
  @media (max-width: 63.99rem) {
    .folder-tabs__list {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
      scroll-snap-type: x proximity;
      scroll-padding-inline: 16px;
    }
    .folder-tabs__list > li {
      flex: none;
    }
    .folder-tab {
      min-width: 48px;
      padding-inline: 12px;
      scroll-snap-align: start;
    }
    /* FOLIO: DESIGN_SYSTEM §5.2 ocultaba aquí el nombre de las pestañas inactivas («05»). Con visitantes que
       llegan sin contexto (PRODUCT.md), un número suelto no dice qué carpeta es: todas llevan su nombre y la
       tira se desplaza con snap. */
  }
  /* El separador «//» solo cabe a partir de 1280 px. */
  @media (max-width: 79.99rem) {
    .folder-tab__sep {
      display: none;
    }
  }
  @media (min-width: 64rem) {
    .folder-tabs {
      padding-inline: 0;
    }
  }

  /* §5.5 DisplayNumeral: la cifra se ajusta al ancho de su contenedor según su número de caracteres. */
  .numeral {
    /* FOLIO: la cifra ocupa la línea (§5.5) con tope de 15rem. Con --text-display como tope, en móvil se
       quedaba en 72 px y media línea vacía.
       El tracking y el ancho medio de glifo dependen de la cara: −0,055em es para Space Grotesk o Helvetica;
       Inter Tight (sustituto temporal) ya es estrecha y con ese valor se tocaban las cifras («11», «17»).
       --glyph-em medido en el navegador con −0,03em. Recalibrar los dos al pasar a Helvetica Now Display. */
    --numeral-tracking: -0.03em;
    --glyph-em: 0.54;
    font-family: var(--font-display-face), 'Arial Narrow', Arial, sans-serif;
    font-weight: 700;
    font-size: min(15rem, calc(100cqi / (var(--chars, 5) * var(--glyph-em))));
    /* Con interlineado 0,82, la coma, la g o la ‘ bajan fuera de la caja y pisarían el pie. */
    padding-block-end: 0.1em;
    line-height: 0.82;
    letter-spacing: var(--numeral-tracking);
    font-variant-numeric: proportional-nums lining-nums;
    white-space: nowrap;
  }
}

/* ─────────────────────────────────────────────────────────────────
   5 · CAMBIO DE LÁMINA — React <ViewTransition> (§6.3)
   ───────────────────────────────────────────────────────────────── */
/* La raíz no se anima: barra de sistema, pestañas y barra de entrada quedan quietas. */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
}

::view-transition-new(.sheet-in-from-right) {
  animation: sheet-in-from-right var(--duration-sheet) var(--ease-sheet) both;
}
::view-transition-new(.sheet-in-from-left) {
  animation: sheet-in-from-left var(--duration-sheet) var(--ease-sheet) both;
}
::view-transition-old(.sheet-out-to-left) {
  animation: sheet-out-to-left var(--duration-exit) var(--ease-out-strong) both;
}
::view-transition-old(.sheet-out-to-right) {
  animation: sheet-out-to-right var(--duration-exit) var(--ease-out-strong) both;
}

@keyframes sheet-in-from-right {
  from {
    transform: translateX(var(--sheet-offset));
    opacity: 0;
  }
}
@keyframes sheet-in-from-left {
  from {
    transform: translateX(calc(var(--sheet-offset) * -1));
    opacity: 0;
  }
}
@keyframes sheet-out-to-left {
  to {
    transform: translateX(calc(var(--sheet-offset) * -1));
    opacity: 0;
  }
}
@keyframes sheet-out-to-right {
  to {
    transform: translateX(var(--sheet-offset));
    opacity: 0;
  }
}

/* Movimiento reducido: menos movimiento, no cero. Se conserva un fundido corto sin desplazamiento. */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(.sheet-in-from-right),
  ::view-transition-new(.sheet-in-from-left) {
    animation: sheet-fade-in 120ms linear both;
  }
  ::view-transition-old(.sheet-out-to-left),
  ::view-transition-old(.sheet-out-to-right) {
    animation: sheet-fade-out 80ms linear both;
  }
}
@keyframes sheet-fade-in {
  from {
    opacity: 0;
  }
}
@keyframes sheet-fade-out {
  to {
    opacity: 0;
  }
}

/* ─────────────────────────────────────────────────────────────────
   6 · FOLIO — extensiones sobre DESIGN_SYSTEM §2.7
   ───────────────────────────────────────────────────────────────── */
@layer components {
  /* §6.5: contenido que llega por streaming después de la lámina. */
  .stream-reveal {
    transition: opacity var(--duration-fast) var(--ease-out-strong);
    @starting-style {
      opacity: 0;
    }
  }
}

@layer base {
  /* Lo que el navegador dibuja por su cuenta también lleva el sistema. */
  html {
    scrollbar-color: var(--color-steel) var(--color-black);
    scrollbar-width: thin;
  }
  [data-surface='folder'] {
    color-scheme: dark;
    caret-color: var(--color-brand-orange);
    accent-color: var(--color-brand-orange);
  }
  [data-surface='paper'] {
    color-scheme: light;
    caret-color: var(--color-black);
    accent-color: var(--color-black);
  }
  [data-surface='canvas'] {
    color-scheme: light;
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--color-ash);
    opacity: 1;
  }
  [data-surface='paper'] input::placeholder,
  [data-surface='paper'] textarea::placeholder {
    color: var(--color-steel);
  }

  /* Cifras de tablas y columnas: tabulares (§3.4). */
  table {
    font-variant-numeric: tabular-nums;
  }
}

/* Colores forzados (§8): las pestañas se dibujan con pseudo-elementos que el modo elimina;
   se sustituyen por un borde real y el estado activo por el color de sistema de selección. */
@media (forced-colors: active) {
  .folder-tab {
    border: 2px solid CanvasText;
  }
  .folder-tab::before,
  .folder-tab::after {
    display: none;
  }
  .folder-tab[aria-current='page'] {
    border-color: Highlight;
    color: Highlight;
  }
}

/* Controles de formulario según la superficie: negros en la carpeta, blancos en el papel (borradores).
   Sobre papel, ni `ash` ni `signal-down` dan contraste de texto (§2.3): etiquetas en `steel`, errores en negro. */
@layer components {
  .control {
    border: 2px solid var(--color-steel);
    background: var(--color-black);
    color: var(--color-white);
    border-radius: 0;
  }
  .control:hover:not(:disabled) {
    border-color: var(--color-ash);
  }
  .control[aria-invalid='true'] {
    border-color: var(--color-signal-down);
  }
  .control:disabled {
    color: var(--color-ash);
  }
  .field-label {
    color: var(--color-ash);
  }
  .field-hint {
    color: var(--color-ash);
  }
  .field-error {
    color: var(--color-signal-down);
  }

  [data-surface='paper'] .control {
    border-color: var(--color-black);
    background: var(--color-white);
    color: var(--color-black);
  }
  [data-surface='paper'] .control:hover:not(:disabled) {
    border-color: var(--color-steel);
  }
  [data-surface='paper'] .control[aria-invalid='true'] {
    border-color: var(--color-black);
    border-style: dashed;
  }
  [data-surface='paper'] .field-label,
  [data-surface='paper'] .field-hint {
    color: var(--color-steel);
  }
  [data-surface='paper'] .field-error {
    color: var(--color-black);
    font-weight: 600;
  }
}

/* Borrador (§5.7): GUARDAR y DESCARTAR siempre a la vista. Si el formulario no cabe (móvil, teclado abierto),
   se desplaza por dentro del papel y la fila de acciones queda fija al pie, tapando el relleno inferior. */
@layer components {
  .draft-sheet [data-form-actions] {
    position: sticky;
    /* Chrome descuenta el relleno del contenedor (p-4) del área de sticky: −1rem la deja a ras del borde. */
    bottom: -1rem;
    z-index: 1;
    margin-inline: -1rem;
    margin-block-end: -1rem;
    padding: 0.75rem 1rem;
    background: var(--color-white);
    border-top: 2px solid var(--color-black);
  }
}
```

---

## 3. Tipografía & jerarquía

### 3.1 Familias

| Rol | Familia | Pesos disponibles | Licencia | Carga | Estado |
|---|---|---|---|---|---|
| Display: cifras y titulares | **Helvetica Now Display** | Hasta Black | Comercial (Monotype) | `next/font/local` | **Elegida por el autor**; pendiente de licencia web y archivos |
| Display, sustituto temporal | Inter Tight | 100–900 (variable) | SIL OFL | `next/font/google` | **En uso** hasta tener Helvetica |
| Display, opción descartada | Space Grotesk | 300–700 (variable) | SIL OFL | `next/font/google` | Era la opción por defecto de la 1.1 |
| UI y texto | **Geist** | 100–900 (variable) | SIL OFL | `next/font/google` | **Por defecto** |
| Datos, índices y etiquetas | **Geist Mono** | 100–900 (variable) | SIL OFL | `next/font/google` | **Por defecto** |

> [!WARNING]
> **«Ultra-bold» no existe en Space Grotesk:** su techo es 700. A tamaño cartel, 700 se lee como negrita plena, pero no llega a *black*. Si la jerarquía exige 800–900, la única opción del brief es Helvetica Now Display, que requiere licencia comercial (no puede subirse a un repositorio público). Syne llega a 800, pero su dibujo ancho y excéntrico pertenece a otra tradición, no al diseño suizo.

**Por qué esta combinación.** En la 1.2 el autor eligió Helvetica Now Display, la opción que este párrafo dejaba para quien buscara distinción real. El resto es el razonamiento de la 1.1. Space Grotesk y Syne son de las caras más repetidas en interfaces generadas; Space Grotesk se mantiene porque el brief la nombra, porque tiene cifras tabulares y porque su dibujo industrial encaja con la metáfora del archivador. Si se busca distinción real, el camino es Helvetica Now Display, la heredera directa de la tradición suiza. Para la UI, Geist es una cara de trabajo neutra con hermana mono, lo que permite un sistema de dos familias y tres papeles. Space Grotesk y Geist no compiten porque **nunca aparecen a tamaños parecidos**: Space Grotesk solo a partir de 36 px.

### 3.2 Carga con `next/font`

Ruta: `src/app/fonts.ts`. Las variables tienen nombres neutros (`--font-display-face`), así que cambiar de familia es una línea y ningún CSS se entera.

```ts
import { Geist, Geist_Mono, Inter_Tight } from 'next/font/google';

// Display: Helvetica Now Display (decisión del autor, PRODUCT.md). Requiere licencia web y sus .woff2
// no pueden ir al repositorio público. Hasta tenerlos, Inter Tight hace de sustituto temporal: grotesca
// neutra, autoalojada por next/font y con cortes hasta Black. Con los archivos, este export pasa a ser
// el localFont de DESIGN_SYSTEM §3.2; la variable CSS no cambia y ningún componente se entera.
export const displayFace = Inter_Tight({ subsets: ['latin'], variable: '--font-display-face', display: 'swap' });
export const sansFace = Geist({ subsets: ['latin'], variable: '--font-sans-face', display: 'swap' });
export const monoFace = Geist_Mono({ subsets: ['latin'], variable: '--font-mono-face', display: 'swap' });

export const fontVariables = `${displayFace.variable} ${sansFace.variable} ${monoFace.variable}`;
```

Con la licencia y los archivos, `displayFace` pasa a ser este `localFont`. Los `.woff2` no pueden publicarse en el repositorio público: tienen que llegar al build por otra vía (por ejemplo, un secreto de Vercel que los descargue antes de compilar). Al cambiar de cara, hay que recalibrar `--numeral-tracking` y `--glyph-em` en `.numeral` (§5.5):

```ts
import localFont from 'next/font/local';

export const displayFace = localFont({
  src: [
    { path: './fonts/HelveticaNowDisplay-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/HelveticaNowDisplay-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-display-face',
  display: 'swap',
});
```

> [!NOTE]
> La cifra protagonista suele ser el **elemento LCP** de cada pestaña. `next/font` precarga la fuente y genera un *fallback* con métricas ajustadas, de modo que el cambio de fuente no mueve el layout (CLS).

### 3.3 Escala

| Utilidad | Tamaño | Interlineado | Tracking | Peso | Familia | Uso |
|---|---|---|---|---|---|---|
| `text-display` | `clamp(4.5rem, 17vw, 15rem)` | 0,82 | −0,055em | 700 | Display | Cifra protagonista en la 1.1. En la 1.2, `.numeral` usa su propia fórmula de ajuste al ancho (§5.5), con 15rem de tope y −0,03em con Inter Tight; el token queda para usos puntuales |
| `text-headline` | `clamp(2.25rem, 5vw, 4rem)` | 0,95 | −0,03em | 700 | Display | Titular del briefing, cabecera de lámina |
| `text-title` | 24 px | 1,15 | −0,01em | 600 | Sans | Título de ficha |
| `text-body` | 16 px | 1,5 | 0 | 400 | Sans | Texto corrido, inputs (evita el zoom de iOS) |
| `text-small` | 14 px | 1,45 | 0 | 400–500 | Sans | Texto secundario, celdas |
| `text-label` | 12 px | 1,2 | +0,08em | 500 | Mono, mayúsculas | Pestañas, botones, etiquetas |
| `text-micro` | 11 px | 1,2 | +0,1em | 400 | Mono, mayúsculas | Metadatos de esquina; **nunca información esencial** |

### 3.4 Reglas de jerarquía

1. **Tracking negativo en display, positivo en mayúsculas.** Las cifras grandes se aprietan; las etiquetas en mayúsculas se abren.
2. **Medida de lectura** de 45 a 75 caracteres (`max-w-[65ch]`) en texto corrido: diario, reseñas, briefing.
3. **Cifras proporcionales en la cifra protagonista, tabulares en columnas.** `tabular-nums` da a cada dígito el ancho de un `0`: alinea columnas, pero deja un `1` perdido en un hueco ancho a tamaño cartel.
4. **Formato español con `Intl`:** `new Intl.NumberFormat('es-ES', …)`. Coma decimal, euro detrás con espacio fino (`812,40 €`). Ojo: **`es-ES` no agrupa las cifras de cuatro dígitos** (`1284`, pero `12.840`). Es la norma, no un fallo.
5. **La fecha protagonista** (`27‘09`) usa `‘` como separador gráfico; se oculta a lectores de pantalla y se acompaña de la fecha legible («domingo, 27 de septiembre»).
6. **Etiquetas de módulo en inglés** (`VAULT`, `BRAIN`) llevan `lang="en"` para que el lector de pantalla las pronuncie bien, y su nombre en español en texto accesible.

---

## 4. Layout y rejilla

### 4.1 Anatomía

**Móvil (390 px):**

```text
┌──────────────────────────────┐ canvas
│ FOLIO           DOM 27·09  ● │ SystemBar · mono 11 px, negro
│ ┌01 HOME┐┌02 GYM┐┌03 VAULT┐ →│ FolderTabs · todas con nombre; la tira desliza
├──────────────────────────────┤ folder
│ ● 03 // VAULT   MES EN CURSO │ cabecera de lámina · mono 11 px, ash
│                              │
│ 812,40 €                     │ DisplayNumeral
│ GASTO · 64 % DEL PRESUPUESTO │ fila de etiquetas
│ ┌──────────────────────────┐ │
│ │ ficha                    │ │ BrutalistCard (4 columnas)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ? │ «12,40 Mercad… │FOTO│VOZ│ QuickInputBar · papel, fija abajo
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Escritorio (1440 px):**

```text
┌────────────────────────────────────────────────────────────────────┐ canvas
│ FOLIO                           DOM 27·09·2026 07:42       ● EN LÍNEA│
│ ┌01 // HOME┐┌02 // GYM┐┌03 // VAULT┐┌04 // BRAIN┐┌05 // NUTRITION┐ …│
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ ● 03 // VAULT                                    MES EN CURSO   │ │
│ │ 812,40 €                          ┌ficha · 4 col┐┌ficha · 4 col┐│ │
│ │ GASTO DEL MES · 64 % PRESUPUESTO  │ categorías  ││ últimos     ││ │
│ │                                   └─────────────┘└─────────────┘│ │
│ │ ┌ficha · 8 col─────────────────────┐┌ficha · 4 col─┐            │ │
│ │ └──────────────────────────────────┘└──────────────┘            │ │
│ │             ┌ QuickInputBar · 768 px máx., centrada ┐           │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘ marco naranja de 24 px
```

### 4.2 Rejilla

| Rango | Columnas | Medianil | Margen de la lámina | Marco `canvas` |
|---|---|---|---|---|
| < 768 px | 4 | 16 px | 16 px | 0 (carpeta a sangre) |
| 768–1023 px | 8 | 16 px | 24 px | 0 |
| ≥ 1024 px | 12 | 24 px | 32 px | 24 px a los lados y abajo |

Los puntos de corte son los de Tailwind por defecto (`md` 48rem, `lg` 64rem, `xl` 80rem). **Dentro de cada ficha manda su contenedor, no la ventana:** todas las fichas son `@container` y su maquetación interna usa `@sm:`, `@md:`, etc. Así una ficha funciona igual en 4 columnas de escritorio que a ancho completo en móvil.

### 4.3 Viewport y zonas seguras

- Altura con `min-h-dvh`, nunca `100vh` (la barra del navegador móvil lo desborda).
- `viewport-fit=cover` + `env(safe-area-inset-bottom)` en la barra de entrada.
- `interactive-widget=resizes-content`: al abrir el teclado, el contenido se redimensiona y la barra de entrada sube con él.
- `theme-color: #FF3B00`, para que la interfaz del navegador móvil continúe el `canvas`.

---

## 5. Component Specs

### 5.0 Registro de pestañas

Ruta: `src/config/tabs.ts`. Única fuente de verdad del orden, los índices y las rutas.

```ts
export const TABS = [
  { index: 1, slug: 'home', label: 'HOME', name: 'Inicio', href: '/home' },
  { index: 2, slug: 'gym', label: 'GYM', name: 'Entrenamiento', href: '/gym' },
  { index: 3, slug: 'vault', label: 'VAULT', name: 'Finanzas', href: '/vault' },
  { index: 4, slug: 'brain', label: 'BRAIN', name: 'Diario', href: '/brain' },
  { index: 5, slug: 'nutrition', label: 'NUTRITION', name: 'Nutrición', href: '/nutrition' },
  { index: 6, slug: 'media', label: 'MEDIA', name: 'Consumo cultural', href: '/media' },
  { index: 7, slug: 'routine', label: 'ROUTINE', name: 'Hábitos y foco', href: '/routine' },
  { index: 8, slug: 'settings', label: 'SETTINGS', name: 'Configuración', href: '/settings' },
] as const;

export type Tab = (typeof TABS)[number];
export type TabSlug = Tab['slug'];

export const formatIndex = (index: number) => String(index).padStart(2, '0');

export function tabForPath(pathname: string): Tab | undefined {
  return TABS.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
}
```

### 5.1 `FolderShell` — el layout del sistema

Ruta: `src/app/(os)/layout.tsx`. Persiste entre pestañas; solo la lámina cambia.

```tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { FolderTabs } from '@/components/os/FolderTabs';
import { QuickInputDock } from '@/components/os/QuickInputDock';
import { SystemBar } from '@/components/os/SystemBar';
import { TabShortcuts } from '@/components/os/TabShortcuts';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';

// FolderShell (DESIGN_SYSTEM §5.1): persiste entre pestañas; solo cambia la lámina.
// El proxy ya redirige sin sesión; comprobarlo aquí es la segunda barrera.
export default async function OsLayout({ children }: { children: ReactNode }) {
  if (!(await requireUserId(await createClient()))) redirect('/login');
  const profile = await getProfile();

  return (
    // grid-cols-[minmax(0,1fr)]: sin plantilla, la columna implícita crece hasta el ancho mínimo del contenido
    // (la tira de pestañas, una tabla) y en móvil toda la carpeta desbordaba en horizontal.
    <div
      data-surface="canvas"
      className="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_1fr] lg:px-6 lg:pb-6"
    >
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:bg-black focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <SystemBar displayName={profile.display_name} timeZone={profile.timezone} />
      <FolderTabs />
      <main
        id="contenido"
        data-surface="folder"
        className="relative flex flex-col pb-[calc(var(--quick-bar-height)+env(safe-area-inset-bottom))]"
      >
        {children}
        <QuickInputDock />
      </main>
      <TabShortcuts />
    </div>
  );
}
```

`QuickInputDock` es el contenedor cliente que conecta la `QuickInputBar` (§5.6) con las subidas y las Server Actions de [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3. `SystemBar` es un Server Component: `FOLIO` a la izquierda, fecha y hora en la zona horaria del perfil en el centro, punto de estado a la derecha, todo en `text-micro`.

### 5.2 `FolderTabs.tsx`

Ruta: `src/components/os/FolderTabs.tsx` (+ CSS en `globals.css`, capa `components`).

#### Anatomía

```text
            ← 10 px →                 ← 10 px →
           ┌───────────────────────────┐          ← activa: forma izada 8 px, relleno negro, texto blanco
          /   03 // VAULT              \
   ┌─────/─────────┐┌──────────────────\──┐       ← inactivas: contorno negro de 2 px, relleno = canvas
  /  02 // GYM     \/  04 // BRAIN        \
 ████████████████████████████████████████████    ← borde superior de la carpeta (negro)
```

Cada pestaña es un **trapecio troquelado** (lados a 10 px de inclinación) dibujado con dos capas de `clip-path`: el contorno negro y el relleno, desplazado 2 px hacia dentro. La pestaña activa se iza y se funde con la carpeta, sin costura.

#### Geometría

| Propiedad | Valor | Por qué |
|---|---|---|
| Caja | 48 px de alto, fija | El área táctil no cambia al izarse; solo cambia la forma dibujada |
| Forma | `polygon(10px top, 100%−10px top, 100% 100%, 0 100%)` | Silueta de pestaña de carpeta física |
| Izado | 0 inactiva · 4 px hover · 8 px activa | La carpeta que se tira hacia arriba del cajón |
| Contorno | 2 px negro | Regla de bordes |
| Etiqueta | Mono 12 px, mayúsculas, +0,08em | Índice industrial |
| Columnas (≥ 1024 px) | 8 iguales, 4 px de separación | Rejilla propia de la tira |

#### Estados

| Estado | Relleno | Contorno | Texto | Izado | Transición |
|---|---|---|---|---|---|
| `Inactive` | `canvas` (se ve como contorno) | Negro 2 px | Negro | 0 | — |
| `Hover` (solo puntero fino) | `canvas` | Negro 2 px | Negro | 4 px | `clip-path` y `translate`, 160 ms `ease-out-strong` |
| `Pressed` | `canvas` | Negro 2 px | Negro | 2 px | Inmediato |
| `Active` (`aria-current="page"`) | Negro, fundido con la carpeta | Negro | Blanco | 8 px | **Color instantáneo**; izado 160 ms |
| `Focus-visible` | El del estado | + anillo negro de 3 px a 2 px de distancia | — | — | Inmediato; nunca se suprime |

#### Semántica y teclado

- **Parecen pestañas, pero son navegación.** Cada una cambia la URL, así que se marcan como `<nav aria-label="Módulos">` con enlaces y `aria-current="page"`. `role="tablist"` sería incorrecto: ese patrón es para paneles dentro de una misma página.
- Nombre accesible: «03 VAULT, Finanzas». Separador `//` oculto; nombre inglés con `lang="en"`; nombre español como texto solo para lectores de pantalla.
- **Atajos `1`–`8`** (fuera de campos de texto) llevan a cada pestaña, **sin animación** (§6.1). Por ser atajos de una sola tecla, se pueden desactivar en `08 // SETTINGS` (WCAG 2.1.4).

#### Responsive

| Ancho | Contenido de la pestaña |
|---|---|
| ≥ 1280 px | `05 // NUTRITION` |
| 1024–1279 px | `05 NUTRITION` |
| < 1024 px | `05 NUTRITION` en todas (1.2: antes, las inactivas solo mostraban `05`). La tira desliza en horizontal con *snap* y la activa se desplaza a la vista moviendo solo la tira, sin animar el scroll |

#### Implementación

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { TABS, formatIndex, tabForPath } from '@/config/tabs';

export function FolderTabs() {
  const pathname = usePathname();
  const active = tabForPath(pathname);
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // En móvil la tira desliza: la pestaña activa queda siempre a la vista, sin animar el scroll.
    // Se desplaza solo la tira, y solo si desborda. scrollIntoView() movía además el punto de inicio de la
    // navegación con Tab a la pestaña activa, y el primer Tab se saltaba el enlace «Saltar al contenido».
    const link = activeLink.current;
    const list = link?.closest('ol');
    if (!link || !list || list.scrollWidth <= list.clientWidth) return;
    const left = link.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + link.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = left - 16;
    }
  }, [active?.slug]);

  return (
    <nav aria-label="Módulos" className="folder-tabs">
      <ol className="folder-tabs__list">
        {TABS.map((tab) => {
          const isActive = tab.slug === active?.slug;
          // La dirección del deslizamiento sale del orden físico de las carpetas.
          const direction = active && tab.index < active.index ? 'nav-back' : 'nav-forward';

          return (
            <li key={tab.slug}>
              <Link
                ref={isActive ? activeLink : undefined}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                transitionTypes={isActive ? undefined : [direction]}
                className="folder-tab"
              >
                <span className="folder-tab__label">
                  <span>{formatIndex(tab.index)}</span>
                  <span className="folder-tab__sep" aria-hidden="true">
                    {'//'}
                  </span>
                  <span className="folder-tab__name" lang="en">
                    {tab.label}
                  </span>
                  <span className="sr-only">, {tab.name}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

Atajos de teclado, en `src/components/os/TabShortcuts.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TABS } from '@/config/tabs';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
export const SINGLE_KEY_SHORTCUTS_KEY = 'dossier:single-key-shortcuts';

function singleKeyShortcutsEnabled() {
  try {
    return localStorage.getItem(SINGLE_KEY_SHORTCUTS_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function TabShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || EDITABLE_TAGS.has(target.tagName))) return;
      if (!singleKeyShortcutsEnabled()) return;

      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('quick-input')?.focus();
        return;
      }

      const tab = TABS[Number(event.key) - 1];
      if (tab && /^[1-8]$/.test(event.key)) {
        event.preventDefault();
        // Sin transitionTypes: con teclado la lámina cambia al instante.
        router.push(tab.href);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return null;
}
```

### 5.3 `Sheet` — la lámina

Ruta: `src/components/os/Sheet.tsx`. Raíz de **cada** página de pestaña. Envuelve el contenido en `<ViewTransition>` (estable desde React 19.3; en Next.js funciona sin configuración). Va en la página y no en el layout porque el layout persiste entre navegaciones y en él nunca se dispararían `enter` ni `exit`.

```tsx
import { ViewTransition, type ReactNode } from 'react';

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'sheet-in-from-right', 'nav-back': 'sheet-in-from-left', default: 'none' }}
      exit={{ 'nav-forward': 'sheet-out-to-left', 'nav-back': 'sheet-out-to-right', default: 'none' }}
      default="none"
    >
      <div className="grid grid-cols-4 gap-4 px-4 pt-6 md:grid-cols-8 md:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
        {children}
      </div>
    </ViewTransition>
  );
}
```

Uso en una página:

```tsx
// src/app/(os)/vault/page.tsx (simplificado: la página real añade señales, formularios y la lista del mes)
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { getVaultMonth } from '@/modules/vault/queries';

export default async function VaultPage() {
  const vault = await getVaultMonth();

  return (
    <Sheet>
      <SheetHeader tab="vault" meta="Mes en curso" />
      <DisplayNumeral
        value={vault.spent}
        format={{ style: 'currency', currency: vault.currency }}
        label="Gasto del mes"
        caption={vault.budget ? `Gasto · ${vault.budgetPct} % del presupuesto` : 'Gasto del mes'}
        lastSeenKey="vault.spend_mtd"
        upIsGood={false}
      />
      {/* fichas del módulo */}
    </Sheet>
  );
}
```

`loading.tsx` de cada pestaña devuelve `<Sheet>` con fichas esqueleto: así la transición anima el esqueleto al instante y los datos llegan después, por *streaming*.

### 5.4 `BrutalistCard.tsx`

Ruta: `src/components/ui/BrutalistCard.tsx`.

| Variante | Fondo | Borde | Sombra | Uso |
|---|---|---|---|---|
| `flat` | `structure` | 2 px `line` | Ninguna | Ficha de datos por defecto |
| `raised` | `structure` | 2 px blanco | `shadow-hard` en naranja (tinta de la carpeta) | Ficha pulsable |
| `paper` | Blanco | 2 px negro | `shadow-hard` | Pendiente de decisión (borradores) |

**Interacción** (solo si la ficha es un enlace): *hover* levanta 2 px en diagonal y alarga la sombra a 6 px; *press* **hunde la ficha dentro de su sombra** (se desplaza 4 px y la sombra desaparece), el gesto canónico del brutalismo. Ambas transiciones animan solo `translate` y `box-shadow`.

**Reglas:**

- Todas las fichas tienen borde de 2 px, aunque sea del color del fondo: en **modo de colores forzados** (Windows) las sombras desaparecen y el borde es lo único que dibuja la ficha.
- Una ficha-enlace no puede contener otros controles (interactivos anidados). Si necesita botones, el título es el enlace.
- Cada ficha es un contenedor (`@container`): su contenido se maqueta por su propio ancho.

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'flat' | 'raised' | 'paper';

const VARIANT: Record<Variant, string> = {
  flat: 'border-line bg-structure text-white',
  raised: 'border-white bg-structure text-white shadow-hard',
  paper: 'border-black bg-white text-black shadow-hard',
};

const MUTED: Record<Variant, string> = {
  flat: 'text-ash',
  raised: 'text-ash',
  paper: 'text-steel',
};

const PRESSABLE = [
  'transition-[translate,box-shadow] duration-(--duration-fast) ease-out-strong',
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
  'active:translate-x-1 active:translate-y-1 active:shadow-none active:duration-(--duration-press)',
].join(' ');

type BrutalistCardProps = {
  variant?: Variant;
  title?: string;
  eyebrow?: string;
  href?: string;
  className?: string;
  children: ReactNode;
};

export function BrutalistCard({
  variant = 'flat',
  title,
  eyebrow,
  href,
  className = '',
  children,
}: BrutalistCardProps) {
  const classes = [
    '@container relative block border-2 p-4 lg:p-5',
    VARIANT[variant],
    href ? PRESSABLE : '',
    className,
  ].join(' ');
  const surface = variant === 'paper' ? 'paper' : undefined;

  const content = (
    <>
      {(title || eyebrow) && (
        <header className="mb-4 flex items-baseline justify-between gap-4">
          {title ? <h2 className="text-title font-semibold">{title}</h2> : null}
          {eyebrow ? <p className={`font-mono text-micro uppercase ${MUTED[variant]}`}>{eyebrow}</p> : null}
        </header>
      )}
      {children}
    </>
  );

  return href ? (
    <Link href={href} data-surface={surface} className={classes}>
      {content}
    </Link>
  ) : (
    <section data-surface={surface} className={classes}>
      {content}
    </section>
  );
}
```

### 5.5 `DisplayNumeral.tsx` y `DeltaChip.tsx`

**Contrato:** una por lámina · valor formateado con `Intl` `es-ES` · etiqueta accesible completa · pie en mayúsculas de etiqueta · delta opcional desde la última visita.

**Decisiones:**

- **Server Component.** La cifra llega pintada en el HTML: sin parpadeo, sin JavaScript y lista para ser el LCP.
- **Sin conteo animado.** Un contador que sube desde 0 en cada visita es decoración en una acción frecuente. Lo que sí informa es *qué ha cambiado*: si el valor es distinto al de la última visita, aparece un chip con el delta (`▲ +12,40 €`) durante 4 s.
- **Ajuste al ancho:** el tamaño se calcula con unidades de contenedor según el número de caracteres (`--chars`), así `812,40 €` y `12.840,00 €` ocupan siempre la línea sin desbordar. `--glyph-em` es el ancho medio del glifo de la cara display: 0,54 con Inter Tight y −0,03em de tracking, medido en el navegador sobre cifras reales. Se recalibra con la fuente final.

```tsx
// src/components/ui/DisplayNumeral.tsx
import type { CSSProperties } from 'react';
import { DeltaChip } from './DeltaChip';

type DisplayNumeralProps = {
  value: number;
  format?: Intl.NumberFormatOptions;
  /** Nombre accesible, p. ej. «Gasto del mes». */
  label: string;
  /** Texto en mayúsculas de etiqueta bajo la cifra. */
  caption?: string;
  /** Sustituye al número formateado (p. ej. la fecha 27‘09). */
  display?: string;
  /** Versión legible de `display` para lectores de pantalla. */
  srValue?: string;
  /** Si se indica, muestra el cambio desde la última visita. */
  lastSeenKey?: string;
  /** Subir es bueno (volumen) o malo (gasto): decide el color del delta. */
  upIsGood?: boolean;
};

export function DisplayNumeral({
  value,
  format,
  label,
  caption,
  display,
  srValue,
  lastSeenKey,
  upIsGood = true,
}: DisplayNumeralProps) {
  const text = display ?? new Intl.NumberFormat('es-ES', format).format(value);

  return (
    <figure className="@container col-span-full">
      <p className="numeral" style={{ '--chars': text.length } as CSSProperties}>
        <span aria-hidden="true">{text}</span>
        <span className="sr-only">{`${label}: ${srValue ?? text}`}</span>
      </p>
      {caption || lastSeenKey ? (
        <figcaption className="mt-3 flex flex-wrap items-center gap-3 font-mono text-label text-ash uppercase">
          {caption}
          {lastSeenKey ? (
            <DeltaChip value={value} storageKey={lastSeenKey} format={format} upIsGood={upIsGood} />
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
```

```tsx
// src/components/ui/DeltaChip.tsx
'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState } from 'react';
import { exitFast, springSnap } from '@/lib/motion/tokens';

type DeltaChipProps = {
  value: number;
  storageKey: string;
  format?: Intl.NumberFormatOptions;
  upIsGood: boolean;
};

export function DeltaChip({ value, storageKey, format, upIsGood }: DeltaChipProps) {
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const key = `dossier:last-seen:${storageKey}`;
    let previous: number | null = null;
    try {
      const raw = localStorage.getItem(key);
      previous = raw === null ? null : Number(raw);
      localStorage.setItem(key, String(value));
    } catch {
      return; // Sin almacenamiento no hay delta; la cifra sigue siendo correcta.
    }
    if (previous === null || Number.isNaN(previous) || previous === value) return;

    // El chip aparece en el siguiente fotograma, no dentro del efecto: evita un render en cascada.
    const change = previous;
    const show = requestAnimationFrame(() => setDelta(value - change));
    const hide = setTimeout(() => setDelta(null), 4000);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [storageKey, value]);

  const favourable = delta !== null && delta > 0 === upIsGood;
  const formatted =
    delta === null ? '' : new Intl.NumberFormat('es-ES', { ...format, signDisplay: 'always' }).format(delta);

  return (
    <AnimatePresence>
      {delta !== null ? (
        <m.span
          key="delta"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: exitFast }}
          transition={springSnap}
          className={`border-2 px-1.5 py-0.5 ${favourable ? 'border-signal-up text-signal-up' : 'border-signal-down text-signal-down'}`}
        >
          <span aria-hidden="true">{delta > 0 ? '▲ ' : '▼ '}</span>
          {formatted}
          <span className="sr-only"> desde tu última visita</span>
        </m.span>
      ) : null}
    </AnimatePresence>
  );
}
```

### 5.6 `QuickInputBar.tsx`

Ruta: `src/components/os/QuickInputBar.tsx`. Barra flotante inferior, siempre presente, sobre `paper`.

#### Anatomía

```text
 móvil     ┌───────────────────────────────────────────┐
           │ [?] │ «12,40 Mercadona» o foto…│ FOTO │ VOZ │   VOZ se convierte en ENVIAR cuando hay texto
           └───────────────────────────────────────────┘
           GRABANDO 00:12                                   fila de estado (role="status")

 ≥ 768 px  ┌───────────────────────────────────────────────────────────┐
           │ PREGUNTAR │ «12,40 Mercadona» o foto del ticket │ FOTO │ VOZ │
           └───────────────────────────────────────────────────────────┘
```

#### Modos

- **`REGISTRAR` es el modo por defecto;** **`PREGUNTAR`** es un interruptor (`role="switch"`) con texto fijo. Un conmutador explícito no cuesta una llamada de IA ni se equivoca de intención (ver [`PROPOSAL.md`](./PROPOSAL.md) §2.2).
- El texto de ayuda cambia con la pestaña activa: la pestaña es el contexto.
- **`VOZ` ↔ `ENVIAR`:** con el campo vacío, el botón principal dicta; con texto, envía. Es el patrón de las apps de mensajería y ahorra un botón en móvil.

#### Estados

| Estado | Barra | Fila de estado | Punto |
|---|---|---|---|
| `idle` | Normal | Vacía (reserva altura: sin saltos de layout) | — |
| `focused` | Anillo naranja de 3 px alrededor de toda la barra (`focus-within`) | — | — |
| `recording` | Campo desactivado; botón `PARAR` invertido | `GRABANDO 00:12` | Naranja, pulsando |
| `uploading` | Botones desactivados | `SUBIENDO…` | — |
| `processing` | Botones desactivados | `LEYENDO EL TICKET_` con cursor intermitente | Naranja fijo |
| `draft` | El borrador (`DraftSheet`, §5.7) sube por encima de la barra | `REVISA Y CONFIRMA` | — |
| `error` | Normal; **nunca se pierde lo escrito, fotografiado o grabado** | Mensaje concreto + `REINTENTAR` | — |

```tsx
'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { TabSlug } from '@/config/tabs';
import { exitFast, springSheet } from '@/lib/motion/tokens';

export type QuickMode = 'log' | 'ask';

export type QuickStatus =
  | { kind: 'idle' }
  | { kind: 'recording'; seconds: number }
  | { kind: 'uploading' }
  | { kind: 'processing'; label: string }
  | { kind: 'error'; message: string }
  /** Hay un borrador encima de la barra esperando confirmación. */
  | { kind: 'draft' }
  /** Recién guardado: el aviso ofrece DESHACER durante unos segundos (§5.7). */
  | { kind: 'saved'; message: string; undoable: boolean };

type QuickInputBarProps = {
  context: TabSlug;
  status: QuickStatus;
  /** Borrador de IA pendiente de confirmar, si lo hay. */
  draft?: ReactNode;
  /** Devuelve false si el texto no se ha podido usar: entonces se conserva en la barra. */
  onText: (mode: QuickMode, text: string) => boolean | Promise<boolean>;
  onImage: (file: File) => void;
  onToggleRecording: () => void;
  onRetry?: () => void;
  onUndo?: () => void;
  /**
   * Qué entradas hay disponibles. Fase 2: solo texto (PROPOSAL §5), así que el contenedor apaga preguntar,
   * foto y voz; sin voz, el botón principal es siempre ENVIAR. Fase 3: todo activo, como en §5.6.
   */
  capabilities?: { ask?: boolean; photo?: boolean; voice?: boolean };
};

const HINTS: Record<TabSlug, string> = {
  home: '«12,40 Mercadona», «sentadilla 5×5 a 100»…',
  gym: '«press banca, 4 series de 8 a 80»',
  vault: '«12,40 Mercadona»',
  brain: 'Escribe la entrada de hoy',
  nutrition: '«200 g de pollo con arroz»',
  media: '«terminado: Dune, 9 sobre 10»',
  routine: '«hecho: meditar»',
  settings: 'Registra desde cualquier pestaña',
};

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const BUTTON =
  'flex h-11 min-w-11 items-center justify-center gap-2 border-2 border-black px-3 font-mono text-label uppercase';

export function QuickInputBar({
  context,
  status,
  draft,
  onText,
  onImage,
  onToggleRecording,
  onRetry,
  onUndo,
  capabilities = {},
}: QuickInputBarProps) {
  const { ask: canAsk = true, photo: canPhoto = true, voice: canVoice = true } = capabilities;
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const statusId = useId();

  const recording = status.kind === 'recording';
  const busy = status.kind === 'uploading' || status.kind === 'processing';
  const hasText = text.trim().length > 0;

  // Los ejemplos de los estados vacíos escriben aquí: `folio:prefill` con el texto en `detail`.
  useEffect(() => {
    function onPrefill(event: Event) {
      const value = (event as CustomEvent<string>).detail;
      if (typeof value !== 'string') return;
      setAsking(false);
      setText(value);
      document.getElementById('quick-input')?.focus();
    }
    window.addEventListener('folio:prefill', onPrefill);
    return () => window.removeEventListener('folio:prefill', onPrefill);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasText || busy) return;
    // Nunca se pierde lo escrito (§5.6, estado `error`): solo se vacía si el texto se ha podido usar.
    if (await onText(asking ? 'ask' : 'log', text.trim())) setText('');
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-3xl px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:bottom-6 md:px-0">
      <AnimatePresence initial={false}>
        {draft ? (
          <m.div
            key="draft"
            className="mb-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: exitFast }}
            transition={springSheet}
          >
            {draft}
          </m.div>
        ) : null}
      </AnimatePresence>

      <form
        data-surface="paper"
        onSubmit={submit}
        aria-describedby={statusId}
        className="flex items-center gap-2 border-2 border-black p-1.5 shadow-hard focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-brand-orange"
      >
        {canAsk ? (
          <button
            type="button"
            role="switch"
            aria-checked={asking}
            onClick={() => setAsking((value) => !value)}
            className={`${BUTTON} aria-checked:bg-black aria-checked:text-white`}
          >
            Preguntar
          </button>
        ) : null}

        <label htmlFor="quick-input" className="sr-only">
          {asking ? 'Pregunta a tu archivador' : 'Registro rápido'}
        </label>
        <input
          id="quick-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={recording}
          placeholder={asking ? 'Pregunta a tu archivador…' : HINTS[context]}
          enterKeyHint={asking ? 'search' : 'send'}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent px-2 text-body outline-none placeholder:text-steel"
        />

        {canPhoto ? (
          <>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy || recording}
              className={`${BUTTON} disabled:border-steel disabled:text-steel`}
            >
              Foto
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) onImage(file);
              }}
            />
          </>
        ) : null}

        {(hasText || !canVoice) && !recording ? (
          <button
            type="submit"
            disabled={busy || !hasText}
            className={`${BUTTON} bg-black text-white disabled:border-steel disabled:bg-transparent disabled:text-steel`}
          >
            Enviar
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleRecording}
            disabled={busy}
            aria-pressed={recording}
            className={`${BUTTON} aria-pressed:bg-black aria-pressed:text-white`}
          >
            {recording ? (
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full bg-brand-orange motion-safe:animate-rec-pulse"
              />
            ) : null}
            {recording ? 'Parar' : 'Voz'}
          </button>
        )}
      </form>

      <div className="mt-1 flex min-h-5 items-center gap-3 px-1">
        {/* Fondo propio: la fila flota sobre el contenido que pasa por detrás y debe leerse siempre. */}
        <p
          id={statusId}
          role="status"
          className={`px-1 font-mono text-micro text-ash uppercase ${status.kind === 'idle' || status.kind === 'draft' ? '' : 'bg-black'}`}
        >
          {status.kind === 'recording' && `Grabando ${clock(status.seconds)}`}
          {status.kind === 'uploading' && 'Subiendo…'}
          {status.kind === 'processing' && (
            <>
              {status.label}
              <span aria-hidden="true" className="motion-safe:animate-caret-blink">
                _
              </span>
            </>
          )}
          {status.kind === 'error' && status.message}
          {/* El borrador ya lo dice a la vista; aquí solo se anuncia a los lectores de pantalla. */}
          {status.kind === 'draft' && <span className="sr-only">Borrador abierto: revisa y confirma</span>}
          {status.kind === 'saved' && <span className="text-white">{status.message}</span>}
        </p>
        {status.kind === 'saved' && status.undoable && onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="font-mono text-micro text-white uppercase underline underline-offset-4"
          >
            Deshacer
          </button>
        ) : null}
        {status.kind === 'error' && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="font-mono text-micro text-white uppercase underline underline-offset-4"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
```

> [!NOTE]
> El `<input type="file">` no lleva `capture`: así el sistema operativo ofrece cámara **o** galería (un ticket de ayer ya está en el carrete). El campo de texto usa 16 px (`text-body`), por debajo de los cuales iOS hace zoom al enfocar.

### 5.7 `DraftSheet` — borrador de IA

El momento de mayor riesgo del producto: una salida del modelo a punto de convertirse en dato. Por eso es **papel** (blanco = te toca decidir).

| Parte | Especificación |
|---|---|
| Cabecera | `BORRADOR · REVISA ANTES DE GUARDAR` (mono 11 px) + origen (`TICKET`, `PLATO`, `VOZ`) |
| Campos | Todos editables en el sitio. Importes con teclado decimal (`inputMode="decimal"`); fecha con selector nativo |
| Confianza | Texto primero («Confianza: media»), barra después. Por debajo de 0,6, los campos dudosos llevan borde `signal-warn` y un motivo |
| Avisos | Lista concreta: «El IVA no cuadra con el total por 0,03 €» |
| Acciones | `GUARDAR` (negro, principal) · `DESCARTAR` (contorno). Nunca se guarda con Intro por accidente: el foco inicial va al primer campo dudoso, no al botón |
| Después de guardar | Aviso «Gasto guardado» con `DESHACER` durante 5 s |
| Móvil | Arrastrar hacia abajo descarta; basta un gesto rápido (umbral por velocidad, no por distancia) |

### 5.8 Estados vacíos, de carga y de error

| Estado | Regla | Ejemplo |
|---|---|---|
| Vacío | Enseña la entrada, no se disculpa. La cifra protagonista muestra el cero real | `0,00 €` · «Haz una foto a tu próximo ticket.» |
| Carga | Fichas esqueleto opacas (`structure` + borde `line`), sin brillos animados | — |
| Procesando IA | Texto de estado con cursor intermitente, no un *spinner* genérico | `LEYENDO EL TICKET_` |
| Error | Qué ha pasado + qué hacer, sin disculpas ni emojis | «No se pudo leer el ticket. Prueba con más luz o introdúcelo a mano.» |
| Sin presupuesto de IA | La función manual sigue disponible y se dice claramente | «Has llegado al límite de IA de este mes. Puedes registrar a mano.» |

**Voz del producto:** frases cortas, imperativo, tuteo, cifras concretas. Mayúsculas solo en etiquetas.

---

## 6. Motion System

### 6.1 Principios

| Pregunta | Regla del sistema |
|---|---|
| **¿Debe animarse?** | Según la frecuencia. Lo que se hace decenas de veces al día (cambiar de pestaña, *hover*) se anima poco y rápido. **Lo que dispara el teclado no se anima nunca**: atajos `1`–`8`, `/`, Intro |
| **¿Para qué?** | Solo cuatro propósitos: continuidad espacial (de dónde viene la lámina), confirmación (pulsar), indicación de estado (grabando, borrador) y evitar saltos bruscos (contenido que llega por *streaming*) |
| **¿Qué propiedades?** | Solo `transform`, `opacity` y `clip-path`. Nunca `width`, `height`, `top` ni `margin` |
| **¿Qué curva?** | Muelle para lo espacial; `ease-out-strong` para entradas pequeñas; lineal para lo continuo. **Nunca `ease-in`** en interfaz |
| **¿Y el color?** | Instantáneo. El cambio de estado de una pestaña es un interruptor, no un fundido |
| **¿Entrada y salida?** | La salida siempre más rápida que la entrada: el sistema responde rápido y se toma su tiempo solo cuando presenta algo |
| **¿Qué motor?** | CSS (transiciones, `@starting-style`, View Transitions) para lo predeterminado, que corre fuera del hilo principal; **Motion** para lo interrumpible y lo que responde al dedo (presencia, arrastre, springs) |

### 6.2 Tokens

#### Springs

| Token | `stiffness` | `damping` | `mass` | ζ (amortiguamiento) | Sobreoscilación | Asentamiento (2 %) | Uso |
|---|---|---|---|---|---|---|---|
| `springSheet` | 300 | 30 | 1 | 0,866 | 0,43 % | 0,31 s | Láminas, borradores: todo desplazamiento espacial |
| `springSnap` | 700 | 50 | 1 | 0,945 | ≈ 0 | 0,16 s | Retroalimentación pequeña (chips, indicadores) |

El spring del brief (300 / 30) es **casi crítico**: la sobreoscilación de 0,43 % sobre un desplazamiento de 32 px es de 0,14 px, invisible. Se percibe como un frenado firme, sin rebote, que es lo que pide una lámina de papel dentro de un archivador.

#### Curvas y duraciones

| Token | Valor | Uso |
|---|---|---|
| `--ease-out-strong` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entradas pequeñas, *hover*, salidas |
| `--ease-in-out-strong` | `cubic-bezier(0.77, 0, 0.175, 1)` | Movimiento en pantalla (pulso de grabación) |
| `--ease-sheet` | `linear(…)` (§2.7) | El spring 300 / 30 muestreado, para CSS y View Transitions |
| `--duration-press` | 100 ms | Pulsar |
| `--duration-fast` | 160 ms | *Hover*, izado de pestaña |
| `--duration-base` | 240 ms | Fundidos |
| `--duration-exit` | 200 ms | Salida de lámina |
| `--duration-sheet` | 400 ms | Entrada de lámina (la cola final del muelle es subpíxel) |

#### Del muelle a `linear()`

La misma física alimenta a Motion (JavaScript) y a CSS. Para un muelle subamortiguado que parte del reposo, `x(t) = 1 − e^(−ζω₀t) · (cos ω_d t + (ζω₀ / ω_d) · sin ω_d t)`, con `ω₀ = √(k/m)` y `ω_d = ω₀√(1 − ζ²)`. El script lo muestrea y genera el valor de `--ease-sheet`:

```ts
// scripts/spring-to-linear.ts · npx tsx scripts/spring-to-linear.ts
type Spring = { stiffness: number; damping: number; mass?: number };

export function springToLinear({ stiffness, damping, mass = 1 }: Spring, durationS: number, steps = 20): string {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta >= 1) throw new Error('Solo muelles subamortiguados (ζ < 1)');
  const wd = w0 * Math.sqrt(1 - zeta ** 2);
  const x = (t: number) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));

  const stops = Array.from({ length: steps + 1 }, (_, i) => {
    const value = i === steps ? 1 : x((i / steps) * durationS);
    return `${Number(value.toFixed(3))} ${Math.round((i / steps) * 100)}%`;
  });
  return `linear(${stops.join(', ')})`;
}

console.log(springToLinear({ stiffness: 300, damping: 30 }, 0.4));
```

#### `src/lib/motion/tokens.ts`

```ts
import type { Transition } from 'motion/react';

/** Spring del brief. ζ ≈ 0,87 → sobreoscilación 0,43 %, asentamiento (2 %) 0,31 s. */
export const springSheet = { type: 'spring', stiffness: 300, damping: 30, mass: 1 } as const satisfies Transition;

/** Retroalimentación pequeña. ζ ≈ 0,94, asentamiento 0,16 s. */
export const springSnap = { type: 'spring', stiffness: 700, damping: 50, mass: 1 } as const satisfies Transition;

export const easeOutStrong = [0.23, 1, 0.32, 1] as const;

/** Las salidas siempre más rápidas que las entradas. */
export const exitFast = { duration: 0.12, ease: easeOutStrong } as const satisfies Transition;

export const STAGGER_S = 0.04;
```

### 6.3 Transición entre pestañas: láminas en el archivador

**Diseño:** al cambiar de pestaña con el puntero o el dedo, la lámina saliente se retira 32 px (24 px en móvil) en la dirección contraria y se desvanece en 200 ms; la entrante llega desde el lado de su carpeta con el muelle 300 / 30. La dirección sale del orden físico: ir de `03` a `05` desliza hacia la izquierda, porque la carpeta 05 está a la derecha. Barra de sistema, pestañas y barra de entrada no se mueven: solo cambia la lámina.

**Motor: React `<ViewTransition>`, con la física del brief convertida a `linear()`.** Es una decisión deliberada frente a `AnimatePresence` de Motion:

| Criterio | `AnimatePresence` + App Router | `<ViewTransition>` |
|---|---|---|
| Animación de salida | El App Router sustituye la página antes de que pueda animarse; la solución habitual («FrozenRouter») depende de módulos internos de Next.js | Nativa: el navegador conserva una instantánea de la lámina saliente |
| Hilo | Principal, justo cuando la navegación está procesando el payload de RSC y renderizando | Compositor, fuera del hilo principal |
| API | Estable, pero con apaños | Estable (React 19.3); `transitionTypes` en `<Link>` para la dirección |
| Sin soporte del navegador | — | La navegación funciona igual, sin animar |
| Interrupción | Manual | React interrumpe la transición en curso si empieza otra |

La física no cambia: el mismo spring 300 / 30 vive en `springSheet` (Motion) y en `--ease-sheet` (CSS). La implementación completa está en el componente `Sheet` (§5.3), en `FolderTabs` (§5.2, `transitionTypes`) y en el bloque 5 de `globals.css` (§2.7).

| Disparador | Tipo de transición | Resultado |
|---|---|---|
| Clic o toque en una pestaña a la derecha | `nav-forward` | Lámina desde la derecha |
| Clic o toque en una pestaña a la izquierda | `nav-back` | Lámina desde la izquierda |
| Atajo `1`–`8` | Ninguno | Cambio instantáneo |
| Atrás / adelante del navegador | Ninguno | Cambio instantáneo |
| `prefers-reduced-motion` | El mismo | Fundido de 120 ms, sin desplazamiento |

### 6.4 Micro-interacciones

| Elemento | Disparador | Animación | Tiempo | Motor | Movimiento reducido |
|---|---|---|---|---|---|
| Botón o ficha pulsable | *Press* | Se hunde en su sombra: `translate(4px, 4px)`, sombra a 0 | 100 ms `ease-out-strong` | CSS | Igual (no hay desplazamiento percibido como movimiento) |
| Ficha pulsable | *Hover* (puntero fino) | Sube 2 px en diagonal, sombra de 4 a 6 px | 160 ms | CSS | Sin desplazamiento; solo la sombra |
| Pestaña inactiva | *Hover* | Izado de 4 px (`clip-path` + etiqueta) | 160 ms | CSS | Sin cambio |
| Pestaña | Pasa a activa | Color instantáneo + izado de 8 px | 0 ms + 160 ms | CSS | Solo el color |
| Punto de estado | Grabando | Pulso de escala 1 → 1,35 y opacidad | Bucle de 1,2 s | CSS | Punto fijo + texto `GRABANDO` |
| Cursor de estado | Procesando | Parpadeo en escalón | 1 s, `steps(1)` | CSS | Fijo |
| `DraftSheet` | Aparece / se va | Sube 24 px + opacidad / baja 12 px + opacidad | `springSheet` / 120 ms | Motion | Solo opacidad |
| `DraftSheet` (móvil) | Arrastrar hacia abajo | Sigue al dedo; descarta si la velocidad lo indica | `springSheet` al soltar | Motion (`drag="y"`) | Botón `DESCARTAR` |
| `DeltaChip` | Cambio de cifra | Sube 4 px + opacidad | `springSnap` | Motion | Solo opacidad |

Reglas de implementación:

- **Nunca `transition: all`.** Siempre la lista exacta de propiedades.
- El *hover* solo existe con puntero fino: en Tailwind v4, `hover:` ya se limita a `@media (hover: hover)`; en CSS propio se escribe `@media (hover: hover) and (pointer: fine)`.
- Motion calcula en el hilo principal las abreviaturas `x`/`y`. Si una animación coincide con trabajo pesado (una navegación, un parseo), va en CSS.

### 6.5 Entrada de widgets

Las fichas **no tienen entrada propia en cada cambio de pestaña**: entran con su lámina. Encadenar la transición de la lámina con la cascada de cada ficha, decenas de veces al día, es exactamente el movimiento que cansa.

Dos excepciones, ambas con propósito:

1. **Contenido que llega por *streaming*** después de la lámina (Suspense): fundido de 160 ms, sin desplazamiento, para que no aparezca de golpe.

```css
/* globals.css, capa components */
.stream-reveal {
  transition: opacity var(--duration-fast) var(--ease-out-strong);
  @starting-style { opacity: 0; }
}
```

2. **El briefing de la mañana** en `01 // HOME`: la primera vez que se ve cada día, sus hallazgos entran en cascada. Es un momento diario, no frecuente, y la cascada guía la lectura del más al menos importante.

```tsx
'use client';

import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { STAGGER_S, springSheet } from '@/lib/motion/tokens';

const list = { hidden: {}, shown: { transition: { staggerChildren: STAGGER_S } } };
const item = { hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0, transition: springSheet } };

export function BriefingInsights({ items, firstViewToday }: { items: { id: string; node: ReactNode }[]; firstViewToday: boolean }) {
  return (
    <m.ol variants={list} initial={firstViewToday ? 'hidden' : false} animate="shown" className="grid gap-4">
      {items.map(({ id, node }) => (
        <m.li key={id} variants={item}>
          {node}
        </m.li>
      ))}
    </m.ol>
  );
}
```

La cascada es decorativa: **nunca bloquea la interacción** y se puede pulsar cualquier hallazgo mientras entra.

### 6.6 Movimiento reducido y rendimiento

Proveedor en la raíz, `src/components/providers/MotionProvider.tsx`:

```tsx
'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

// domMax (animaciones de layout y arrastre) se descarga aparte, después del primer render.
const loadFeatures = () => import('@/lib/motion/features').then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
```

```ts
// src/lib/motion/features.ts
import { domMax } from 'motion/react';

export default domMax;
```

- **`strict`** hace fallar cualquier `motion.div` dentro de `LazyMotion`: obliga a usar `m.*` (de `motion/react-m`) y protege el ahorro de *bundle*.
- **`reducedMotion="user"`** desactiva en Motion las animaciones de transform y de layout cuando el sistema pide menos movimiento; la opacidad se mantiene. En CSS, las animaciones decorativas van tras `motion-safe:`.
- **Menos movimiento no es cero movimiento:** los fundidos que explican un cambio de estado se conservan, más cortos.

---

## 7. Datos y gráficos

| Regla | Detalle |
|---|---|
| ¿Hace falta un gráfico? | Primero la cifra: si una sola cifra responde, es una `DisplayNumeral` o una ficha, no un gráfico |
| Categorías de gasto | Barras horizontales de **un solo color** (blanco), ordenadas por valor. Categorías nominales en una serie no necesitan colores distintos ni leyenda |
| Más de 8 categorías | Las menores se agrupan en «Otros» |
| Periodo actual | Barra o punto en naranja (el acento); el resto, en `steel` o blanco |
| Marcas | Barras con extremos rectos (sin radio), 2 px de separación, líneas de 2 px, marcadores ≥ 8 px |
| Ejes y rejilla | Recesivos, en `line`; etiquetas en `ash` y mono |
| Texto | Valores y etiquetas en colores de texto, nunca en el color de la serie |
| Señales | `signal-*` solo cuando la serie *significa* bien o mal, y siempre con glifo y etiqueta |
| Un eje | Nunca dos escalas verticales en un mismo gráfico: dos gráficos o índice común |
| Interacción | *Tooltip* al pasar o enfocar cada marca; área de toque mayor que la marca |
| Accesibilidad | Cada gráfico ofrece `VER TABLA`, con los mismos datos en una tabla con `tabular-nums` |

---

## 8. Accesibilidad

Objetivo: **WCAG 2.2 AA**.

| Criterio | Cómo se cumple |
|---|---|
| 1.4.3 / 1.4.11 Contraste | Tabla medida en §2.3; texto sobre `canvas` siempre negro |
| 1.4.1 Uso del color | Señales con signo y glifo; estados de pestaña con forma (contorno frente a relleno) además de color |
| 1.4.4 / 1.4.10 Redimensión y reflujo | Tamaños en `rem`; sin scroll horizontal a 320 px salvo la tira de pestañas, que es un carrusel deliberado |
| 2.1.1 Teclado | Todo es operable con teclado; foco visible siempre |
| 2.1.4 Atajos de una tecla | `1`–`8` y `/` se desactivan desde `08 // SETTINGS` |
| 2.4.1 Saltar bloques | Enlace «Saltar al contenido» |
| 2.4.7 / 2.4.11 Foco visible y no tapado | Anillo de 3 px en el color de foco de la superficie; `scroll-padding-bottom` evita que la barra fija lo tape |
| 2.5.3 Etiqueta en el nombre | El nombre accesible contiene el texto visible (`03 VAULT, Finanzas`) |
| 2.5.8 Tamaño del objetivo | 44 × 44 px mínimo (el criterio pide 24) |
| 3.1.1 / 3.1.2 Idioma | `lang="es"` en `html`; `lang="en"` en las etiquetas de módulo |
| 4.1.3 Mensajes de estado | Fila de estado de la barra con `role="status"`; avisos anunciados |
| Colores forzados | Todas las fichas tienen borde; el foco usa `outline`, que el modo respeta |
| Movimiento | `prefers-reduced-motion` en CSS, Motion y View Transitions |

---

## 9. Guía de implementación paso a paso

1. **Crear el proyecto.** Ya está hecho en la Fase 1 ([`ARCHITECTURE.md`](./ARCHITECTURE.md) §5), con `create-next-app@16.3.6`: TypeScript, Tailwind CSS, App Router, carpeta `src/` y alias `@/*`. Si hubiera que repetirlo, `npx create-next-app .` falla en una carpeta cuyo nombre tiene mayúsculas, como FOLIO: usa ese nombre para el paquete y npm no admite mayúsculas. Se genera en una carpeta en minúsculas y se mueven los archivos. `docs/` y `.claude/` no bloquean el scaffold.

2. **Motion:** ya está instalado con versión fija (`motion` 13.4.4, ARCHITECTURE §0). No uses `npm install motion`, que instalaría la última versión.

3. **Fuentes:** crear `src/app/fonts.ts` (§3.2).

4. **Tokens:** sustituir `src/app/globals.css` por el de §2.7.

5. **Layout raíz** (`src/app/layout.tsx`):

   ```tsx
   import type { Metadata, Viewport } from 'next';
   import type { ReactNode } from 'react';
   import { MotionProvider } from '@/components/providers/MotionProvider';
   import { fontVariables } from './fonts';
   import './globals.css';

   export const metadata: Metadata = {
     title: { default: 'FOLIO', template: '%s · FOLIO' },
     description: 'Sistema operativo personal.',
   };

   export const viewport: Viewport = {
     themeColor: '#FF3B00',
     viewportFit: 'cover',
     interactiveWidget: 'resizes-content',
   };

   export default function RootLayout({ children }: { children: ReactNode }) {
     return (
       <html lang="es" className={fontVariables}>
         <body>
           <MotionProvider>{children}</MotionProvider>
         </body>
       </html>
     );
   }
   ```

6. **Motion:** crear `src/lib/motion/tokens.ts`, `src/lib/motion/features.ts` y el `MotionProvider` (§6.2 y §6.6).

7. **Registro de pestañas:** `src/config/tabs.ts` (§5.0).

8. **Shell:** `src/app/(os)/layout.tsx` (§5.1), `FolderTabs` y `TabShortcuts` (§5.2).

9. **Lámina:** `Sheet` (§5.3) y una página por pestaña que la use como raíz; `src/app/page.tsx` redirige a `/home`.

10. **Primitivas de UI:** `BrutalistCard`, `DisplayNumeral` y `DeltaChip` (§5.4–§5.5).

11. **Barra de entrada:** `QuickInputBar` (§5.6); la conexión con Storage y las Server Actions está en [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.

12. **Revisión:** recorrer la checklist de §10 en escritorio y en un móvil real, no solo en el emulador.

---

## 10. Checklist de revisión

**Identidad**

- [ ] Cero degradados, transparencias y desenfoques.
- [ ] Solo bordes de 0 o 2 px; ningún radio salvo el punto de estado.
- [ ] Una sola cifra protagonista por lámina.
- [ ] El naranja dentro de la carpeta solo marca estado.
- [ ] El papel blanco solo aparece en la barra de entrada y en borradores.

**Accesibilidad**

- [ ] axe sin violaciones graves ni críticas en las 8 pestañas.
- [ ] Recorrido completo con teclado; el foco se ve siempre y nunca queda bajo la barra.
- [ ] Lector de pantalla: pestañas anunciadas como «03 VAULT, Finanzas, página actual».
- [ ] Emulación de colores forzados (DevTools → Rendering): todas las fichas siguen dibujadas.
- [ ] Emulación de `prefers-reduced-motion`: sin desplazamientos, con fundidos cortos.

**Movimiento**

- [ ] Ninguna animación en acciones de teclado.
- [ ] Ninguna animación de `width`, `height`, `top` o `margin`; ningún `transition: all`.
- [ ] Salidas más rápidas que entradas.
- [ ] Revisado a velocidad reducida (DevTools → Animations al 10 %) y otra vez al día siguiente, con ojos frescos.

**Rendimiento**

- [ ] La cifra protagonista es el LCP y no se mueve al cargar la fuente (CLS < 0,1).
- [ ] Ningún `motion.*` dentro de `LazyMotion` (lo impide `strict`).
- [ ] INP < 200 ms al pulsar pestañas y la barra en un móvil de gama media.
