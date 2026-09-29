---
name: FOLIO
description: Un archivador físico convertido en sistema operativo personal. Mesa naranja, carpeta negra, una pestaña por área de la vida.
colors:
  brand-orange: "#ff3b00"
  black: "#000000"
  white: "#ffffff"
  structure: "#121212"
  line: "#2a2a2a"
  steel: "#6b6b6b"
  ash: "#8a8a8a"
  signal-up: "#00e08a"
  signal-down: "#ff2d55"
  signal-warn: "#ffd400"
typography:
  display:
    fontFamily: "Helvetica Now Display, Inter Tight, Arial Narrow, Arial, sans-serif"
    fontSize: "min(15rem, calc(100cqi / (var(--chars) * 0.54)))"
    fontWeight: 700
    lineHeight: 0.82
    letterSpacing: "-0.03em"
    fontFeature: "\"pnum\" 1, \"lnum\" 1"
  headline:
    fontFamily: "Helvetica Now Display, Inter Tight, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
  micro:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  dot: "9999px"
spacing:
  base: "4px"
  rhythm: "8px"
  gutter: "16px"
  gutter-lg: "24px"
  sheet-margin: "16px"
  sheet-margin-md: "24px"
  sheet-margin-lg: "32px"
  canvas-frame-lg: "24px"
  control-height: "44px"
components:
  button-primary-folder:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-secondary-folder:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-danger-folder:
    backgroundColor: "{colors.black}"
    textColor: "{colors.signal-down}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-primary-paper:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-primary-paper-hover:
    backgroundColor: "{colors.steel}"
    textColor: "{colors.white}"
  button-secondary-paper:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  card-flat:
    backgroundColor: "{colors.structure}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "16px"
  card-raised:
    backgroundColor: "{colors.structure}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "16px"
  card-paper:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
    padding: "16px"
  input-folder:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  input-paper:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  folder-tab:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.black}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 14px 10px"
    height: "48px"
  folder-tab-active:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
  signal:
    backgroundColor: "{colors.structure}"
    textColor: "{colors.signal-up}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
  quick-tab:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
    padding: "12px 0 0"
    width: "64px"
    height: "48px"
  quick-tab-lit:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.black}"
  quick-tab-name:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    typography: "{typography.micro}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  quick-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px"
    width: "min(100%, 768px)"
---

# Design System: FOLIO

Registro del mundo **tal como se construyó** al cerrar la Fase 2, con el refinado de la interfaz de `DESIGN_SYSTEM.md` 1.4 (etiquetas en español, barra de entrada en pestañas solo con icono, estado de presencia). La especificación normativa del autor sigue siendo `docs/DESIGN_SYSTEM.md` (tokens, código de componentes, motion, accesibilidad); este archivo no la sustituye ni copia su código: recoge los valores que el build fija y las desviaciones deliberadas respecto a ella. Si ambos discrepan en un valor, manda el build hasta que el autor actualice la especificación.

## Overview

**Creative North Star: "El archivador que opera"**

FOLIO es un archivador físico que funciona como sistema operativo. Sobre una mesa naranja descansa una carpeta negra abierta, con una pestaña troquelada por cada área de la vida. Dentro, cada lámina tiene una sola cifra a tamaño cartel y fichas oscuras con lo archivado. El papel blanco aparece solo donde toca escribir o decidir. El lenguaje es suizo y brutalista: superficies opacas y planas, esquinas vivas, bordes de 2 px, sombras duras sin desenfoque y etiquetas mono en mayúsculas.

Es una superficie de operación, no un escaparate. La densidad es media y la jerarquía se construye con tamaño y peso, no con color. El naranja no decora: dentro de la carpeta significa *aquí, activo o en vivo*. El movimiento se reserva para el espacio: la lámina entra por el lado en que está su pestaña, con un muelle 300/30. Rechaza el dashboard por defecto de la categoría: tarjetas redondeadas, barra lateral y gráficos pastel.

Hay un solo tema, oscuro, porque la identidad es la relación naranja-negro y el uso es nocturno y en movimiento (gimnasio, caja del supermercado, cama).

**Key Characteristics:**
- Cuatro superficies físicas: mesa `canvas` naranja, carpeta `folder` negra, fichas `structure` y `paper` blanco solo para escribir o decidir.
- Radio 0 y bordes de 0 o 2 px, sin excepciones salvo el punto de estado.
- Sombras duras de 2, 4 o 6 px en la tinta de la superficie de debajo.
- Una cifra protagonista por lámina, ajustada a la línea.
- Etiquetas mono en mayúsculas con tracking abierto; cifras apretadas.
- Toda señal de color lleva glifo y texto.

## Colors

Naranja de señal sobre negro absoluto, grises opacos para la estructura y tres colores de señal que nunca van solos.

### Primary
- **Naranja Mesa** (brand-orange): la mesa del archivador (fondo de `html` y del marco), el relleno de las pestañas inactivas y la selección de texto. Dentro de la carpeta solo marca estado: el punto de la cabecera de lámina, el anillo de foco, la sombra de lo pulsable, la barra del periodo en curso en las tablas de barras y el punto de grabación. Sobre él, el texto es siempre negro (5,88:1).

### Neutral
- **Negro Carpeta** (black): la carpeta abierta, el área de trabajo; el texto sobre naranja y sobre papel; el relleno de la pestaña activa y del botón principal sobre papel.
- **Blanco Papel** (white): el texto sobre la carpeta y las fichas, y la superficie `paper` (barra de entrada y borradores). También el botón principal sobre la carpeta y el borde de la ficha pulsable.
- **Ficha Grafito** (structure): el fondo de las fichas de datos dentro de la carpeta. Nunca es color de texto.
- **Línea Hollín** (line): divisores y el borde de la ficha plana. Es decorativo (1,31:1 sobre grafito), nunca borde de control.
- **Acero** (steel): borde de controles sobre oscuro y texto secundario sobre papel (5,33:1). No sirve para texto sobre oscuro.
- **Ceniza** (ash): texto secundario, etiquetas de campo, cabecera de lámina y pies de cifra sobre la carpeta y las fichas. No sirve para texto sobre papel.

### Señales
- **Verde Subida** (signal-up): cambio favorable, rachas.
- **Rosa Bajada** (signal-down): cambio desfavorable y error sobre oscuro. Tira hacia el rosa para no confundirse con la marca.
- **Amarillo Aviso** (signal-warn): umbral cercano o confianza baja.

### Named Rules
**The Paper Means You Rule.** El blanco como superficie significa «te toca a ti». Solo lo llevan las pestañas y la ficha de la barra de entrada, los borradores pendientes de confirmar y el formulario de acceso. Una ficha de datos nunca es blanca.

**The Orange Is State Rule.** Dentro de la carpeta el naranja solo dice *activo, foco o en vivo*, más la sombra de lo pulsable. Nunca rellena ni decora, y nunca significa «negativo».

**The Glyph Rule.** Ningún color de señal va solo: siempre `▲`, `▼`, `!` o `●` más texto, en un recuadro de 2 px del mismo color. Qué dirección es buena lo decide la métrica: más gasto es `▲` en rosa, más volumen es `▲` en verde.

**The Surface Text Rule.** Sobre papel, ni ceniza ni rosa dan contraste de texto. Las etiquetas pasan a acero y los errores a negro en seminegrita, con el control en borde discontinuo.

## Typography

**Display Font:** Helvetica Now Display (decisión del autor). Mientras no lleguen los archivos con licencia, la sustituye Inter Tight, autoalojada tras la misma variable, con Arial Narrow y Arial como reserva.
**Body Font:** Geist (con system-ui)
**Label/Mono Font:** Geist Mono (con ui-monospace)

**Character:** Una grotesca de cartel, apretada y en negrita, para las cifras. Geist, neutra, trabaja en la UI y su hermana mono lleva índices, etiquetas y datos. Display y sans nunca coinciden a tamaños parecidos: la display solo aparece desde 36 px.

### Hierarchy
- **Display** (700, `min(15rem, 100cqi / (caracteres × 0,54))`, 0,82): la cifra protagonista de cada lámina. Ocupa la línea de su contenedor según su número de caracteres, con tope de 15rem, y lleva cifras proporcionales y 0,1em de relleno inferior para que comas y apóstrofos no pisen el pie.
- **Headline** (700, `clamp(2.25rem, 5vw, 4rem)`, 0,95, −0,03em): titulares puntuales, como el acceso, la página 404 o el temporizador de foco.
- **Title** (600, 1.5rem, 1,15, −0,01em): el título de cada ficha.
- **Body** (400, 1rem, 1,5): texto corrido e inputs. 16 px evita el zoom de iOS al enfocar. Medida máxima de 65ch en diario, reseñas y estados vacíos.
- **Small** (400, 0.875rem, 1,45): celdas, ayudas y errores de campo.
- **Label** (500, 0.75rem, +0,08em, mayúsculas, mono): pestañas, botones, etiquetas de campo, pies de cifra y señales.
- **Micro** (400, 0.6875rem, +0,1em, mayúsculas, mono): barra de sistema, cabecera de lámina, metadatos de ficha y estado de la barra de entrada. Como mucho dos bloques por lámina.

### Named Rules
**The Fit-the-Line Rule.** La cifra protagonista no usa un tamaño fijo: se ajusta al ancho de su contenedor (`--chars` × `--glyph-em`) con tope de 15rem. El tracking y el ancho medio de glifo dependen de la cara (−0,03em y 0,54 con Inter Tight) y deben recalibrarse, medidos en el navegador, cuando entre Helvetica Now Display.

**The Tracking Polarity Rule.** El display se aprieta y las mayúsculas mono se abren. Nunca al revés.

**The Label Case Rule.** Mayúsculas solo en etiquetas de tres palabras como máximo. Los párrafos y los títulos de ficha van en caja normal. Todo el texto va en español con tuteo, también las etiquetas de módulo (`03 // FINANZAS`). El código guarda el nombre en caja normal («Finanzas») y lo pone en mayúsculas el CSS, para que el lector de pantalla lo lea como palabra. Las rutas conservan el slug en inglés (`/vault`).

**The Tabular Columns Rule.** Las tablas usan cifras tabulares y la cifra protagonista, proporcionales. Los números se formatean con `Intl` `es-ES`.

## Layout

La pantalla es un archivador en tres bandas. Arriba, sobre el naranja, la barra de sistema (FOLIO / nombre, fecha y hora locales con segundos, estado de presencia) en micro negra. Debajo, la tira de ocho pestañas, con la activa izada 8 px y fundida con la carpeta. El resto es la carpeta negra, que en escritorio se enmarca con 24 px de naranja a los lados y abajo y en móvil va a sangre.

Dentro de la carpeta, cada lámina es una rejilla de 4 columnas por debajo de 768 px, 8 entre 768 y 1023 px y 12 desde 1024 px. La rejilla alinea arriba: cada ficha tiene su altura natural y ninguna se estira hasta la más alta de su fila. Desde 1024 px, la ficha corta que acompaña a una lista larga se queda fija al desplazarse (24 px bajo el borde superior). El medianil es de 16 px (24 px en escritorio) y el margen de lámina, de 16, 24 y 32 px. El orden es fijo: cabecera de lámina a ancho completo, cifra protagonista a ancho completo con su pie, y después fichas repartidas por columnas. INICIO es la excepción en escritorio: la fecha ocupa media lámina y la otra mitad lleva el índice de las seis carpetas en 3 × 2 (dos por fila en móvil), con la cifra de cada ficha ajustada a su ancho y con tope de 36 px. La base es de 4 px y el ritmo vertical, de 8 px. Cada ficha es un contenedor de consulta: su maquetación interna responde a su propio ancho, no a la ventana.

La barra de entrada son cuatro pestañas de papel, solo con el icono, centradas y enterradas en el borde inferior de la pantalla; su ficha, al abrirse, mide como mucho 768 px y llega hasta el borde. La carpeta reserva debajo lo que asoman las pestañas (56 px) más la zona segura, y `scroll-padding-bottom` impide que el foco quede tapado. La altura usa `min-h-dvh` y la rejilla raíz, `minmax(0, 1fr)`, para que en móvil nada desborde en horizontal.

**Pestañas en móvil.** Por debajo de 1024 px la tira se desplaza en horizontal con snap y **todas las pestañas muestran su nombre**, no solo el índice. Es una desviación deliberada de la especificación, pensada para visitantes que llegan sin contexto. El separador `//` solo aparece desde 1280 px.

Capas: 0 lámina, 1 pestaña activa, 30 barra de entrada, 50 avisos, 60 diálogos y enlace de salto.

## Elevation & Depth

La profundidad es física, no atmosférica. Las superficies son opacas y planas: cero degradados, cero transparencias, cero desenfoques. Lo que se puede pulsar o está pendiente de decisión se levanta con una sombra dura desplazada, sin desenfoque, y al pulsarlo se hunde en ella. El color de la sombra no es fijo: es la tinta de la superficie de debajo (`--shadow-ink`). Sobre la mesa naranja y sobre el papel es negra; dentro de la carpeta es naranja, y se lee como la mesa asomando bajo una ficha desplazada.

### Shadow Vocabulary
- **Hard SM** (`box-shadow: 2px 2px 0 0 var(--shadow-ink)`): definida en el token pero sin uso en el build de la Fase 2; queda para piezas pequeñas pulsables.
- **Hard** (`box-shadow: 4px 4px 0 0 var(--shadow-ink)`): botón principal sobre la carpeta, ficha pulsable, ficha de la barra de entrada, borrador y formulario de acceso.
- **Hard LG** (`box-shadow: 6px 6px 0 0 var(--shadow-ink)`): *hover* de una ficha pulsable, que se levanta 2 px en diagonal.
- **None** (`box-shadow: 0 0 #0000`): estado pulsado. El elemento se desplaza 4 px y la sombra desaparece.

### Named Rules
**The Surface Ink Rule.** La sombra y el anillo de foco los decide la superficie para lo que se apoya encima, nunca el componente. Negro sobre `canvas` y `paper`, naranja sobre `folder`.

**The Sink Rule.** Pulsar es hundirse en la propia sombra: 4 px de desplazamiento, la sombra a cero y 100 ms. El *hover* solo levanta lo que ya tiene sombra.

**The No Misprint Rule.** Un bloque negro relleno sobre papel no lleva sombra: una sombra negra bajo un bloque negro se lee como un fallo de impresión. El botón principal sobre papel responde con un cambio a acero y un hundimiento de 1 px.

## Shapes

Todo es rectangular y de esquina viva (radio 0). La única curva del sistema es el punto de estado (círculo de 8 a 10 px), que marca la lámina activa, la presencia (lleno en línea, hueco ausente, tachado sin conexión) y la grabación. El autor probó botones circulares en la barra de entrada y volvió a las líneas rectas. Los bordes miden 0 o 2 px, sin ningún otro grosor. Todas las fichas llevan borde de 2 px aunque coincida con el fondo, porque en modo de colores forzados es lo único que las dibuja. Los iconos propios siguen la misma geometría: trazo de 2 px, terminaciones cuadradas, uniones en inglete y `currentColor`.

La silueta característica es la **pestaña troquelada**: un trapecio recortado con dos capas, un contorno negro y un relleno desplazado 2 px hacia dentro, cuya arista superior sube al izarse. La activa pierde 2 px por abajo para fundirse con la carpeta, sin costura. La misma silueta, en papel y solo con el icono, forma las pestañas de la barra de entrada, enterradas en el borde inferior.

## Components

### Buttons
Bloques mono en mayúsculas que se hunden al pulsar.
- **Shape:** esquina viva (0), borde de 2 px, 44 px de alto y 44 px de ancho mínimo, 16 px de relleno lateral, texto label. Nunca pasan del ancho de su contenedor: si la etiqueta no cabe, se parte en dos líneas centradas.
- **Principal sobre carpeta:** blanco con texto negro y sombra dura naranja; al pulsar se hunde 4 px. Deshabilitado: acero y sin sombra.
- **Principal sobre papel:** negro con texto blanco y **sin sombra** (The No Misprint Rule). *Hover*: acero; al pulsar baja 1 px.
- **Secundario:** transparente con borde acero sobre la carpeta (blanco en *hover*) o negro sobre papel.
- **Peligro:** borde y texto rosa sobre la carpeta; negro sobre papel, donde el rosa no da contraste.
- **Discreto:** sin borde, subrayado con 4 px de separación; ceniza que pasa a blanco en la carpeta y acero que pasa a negro en el papel.
- **Focus:** anillo global de 3 px con 2 px de separación en la tinta de la superficie.

### Chips (señales y delta)
- **Style:** recuadro de 2 px del color de la señal, texto label en el mismo color y el glifo delante (`▲ ▼ ! ●`). El neutro usa borde acero y texto ceniza.
- **Delta:** junto al pie de la cifra aparece el cambio desde la última visita (`▲ +12,40 €`). Entra con un muelle rápido, se va a los 4 s y su color lo decide si subir es bueno en esa métrica.

### Cards / Containers
- **Corner Style:** esquina viva (0).
- **Background:** grafito con texto blanco; papel blanco con texto negro en la variante de decisión.
- **Variantes:** *plana* (borde hollín, sin sombra; la ficha de datos por defecto), *pulsable* (borde blanco y sombra dura naranja; solo si toda la ficha es un enlace) y *papel* (borde negro y sombra negra; pendiente de decisión).
- **Cabecera:** el título a la izquierda y, alineado a la base a la derecha, un metadato en micro ceniza con un dato real de la ficha: recuento, periodo o fuente («9 registros», «Últimos 7 días», el mes).
- **Internal Padding:** 16 px (20 px en escritorio).
- **Interacción (solo pulsables):** en *hover* se levanta 2 px y la sombra pasa a 6 px; al pulsar se hunde. Solo animan `translate` y `box-shadow`.

### Inputs / Fields
- **Style:** control de 44 px de alto, texto body y 12 px de relleno lateral. El color lo pone la superficie: sobre la carpeta, fondo negro, borde acero y texto blanco; sobre papel, fondo blanco, borde negro y texto negro. Esquina viva.
- **Etiqueta:** encima, en label mono mayúscula ceniza (acero sobre papel). Ayuda y error debajo, en small, conectados por `aria-describedby`.
- **Focus:** anillo global de 3 px en la tinta de la superficie. *Hover*: el borde se aclara a ceniza sobre la carpeta y a acero sobre papel.
- **Error:** borde rosa y mensaje rosa sobre la carpeta; sobre papel, borde negro discontinuo y mensaje negro en seminegrita.
- **Nativo:** `color-scheme`, `caret-color` y `accent-color` siguen la superficie (naranja en la carpeta, negro en el papel). Los *placeholders* son ceniza sobre oscuro y acero sobre papel.

### Navigation
- **Pestañas de carpeta:** ocho pestañas troqueladas de 48 px de alto con etiqueta label (`01 // INICIO`). Las inactivas son naranjas con contorno negro; en *hover* (solo con puntero fino) se izan 4 px y al pulsar, 2 px. La activa es negra, se iza 8 px y se funde con la carpeta. La transición es de 160 ms en `clip-path` y `translate`, sin animar el color.
- **Móvil:** la tira se desplaza con snap y conserva los nombres. Cada pestaña mide 48 px de ancho mínimo.
- **Teclado:** atajos de una tecla (que se pueden desactivar) y cambio de pestaña instantáneo, sin transición.
- **Colores forzados:** los pseudo-elementos se sustituyen por un borde real de 2 px y la activa usa `Highlight`.
- **Barra de sistema y cabecera de lámina:** microtipografía de esquina. La cabecera es el `h1`: punto naranja, índice, `//` y módulo, con el contexto alineado a la derecha. La marca FOLIO lleva delante la carpeta del logotipo, en negro y a 12 px de alto (`FolioMark`), en la barra de sistema, el acceso y las páginas legales. El logotipo completo es la carpeta sobre un cuadrado naranja de la mesa (`#FF3B00`) con las esquinas redondeadas, la única curva de la marca junto al punto de estado: solo aparece en los iconos de la app y en el README. La barra de sistema lleva la hora con segundos (mono, así que no baila) y, en la esquina, el estado: «En línea», «Ausente» (30 s sin actividad o la ventana sin foco) o «Sin conexión», con el punto detrás del texto para que no se mueva.

### Cifra protagonista (DisplayNumeral)
Una sola por lámina, blanca y a ancho completo. La cifra se ajusta a la línea (The Fit-the-Line Rule), lleva debajo un pie en label ceniza y, opcionalmente, el delta. Los lectores de pantalla reciben la versión legible («Gasto del mes: 812,40 €»). La fecha usa `‘` como separador gráfico (`28‘09`), oculto a lectores de pantalla.

### Barra de entrada (QuickInputBar)
Cuatro pestañas troqueladas de papel en el borde inferior, solo con el icono: REGISTRAR, PREGUNTAR, FOTO y VOZ. Miden 64 × 48 px y asoman 34 px enterradas en el borde (44 en táctil). Al pasar por encima, la pestaña sale entera, se enciende en naranja y muestra su nombre en una etiqueta de papel (micro mono, borde de 2 px, esquina viva). Nunca flota: su base es el borde del que sale. Al pulsarla sale su ficha: papel blanco con borde negro de 2 px, 8 px de relleno y sombra dura naranja. Las pestañas viajan encima. La abierta queda entera sobre el borde de la ficha, encendida y con su nombre, y las demás se entierran tras ese borde.

- **Una función por ficha.** REGISTRAR y PREGUNTAR llevan un campo y ENVIAR. FOTO abre el selector en el mismo gesto y ofrece ELEGIR FOTO. VOZ graba al pulsarla, con el punto naranja, el tiempo, CANCELAR y ENVIAR. La conversación de PREGUNTAR flota encima, en superficie oscura.
- **Campo:** una línea de escritura de 2 px que pasa de acero a negro al enfocarse. No hay anillo alrededor de la barra: con la sombra dura quedaba descuadrado.
- **Fila de estado:** dentro de la ficha, bajo una raya negra, y solo cuando hay mensaje. Micro en acero; los errores en negro seminegrita con `!` y los guardados con una ✓ que se traza. DESHACER, REINTENTAR y las acciones del contenedor van como enlaces subrayados.
- **Cerrar:** ✕, Escape, la misma pestaña o pulsar fuera si no hay texto ni aviso. Con algo en curso o un borrador pendiente no se cierra ni se cambia. Lo escrito nunca se borra si no se ha podido usar, y cada campo conserva su texto al cerrar.
- **Atajo `/`:** abre REGISTRAR con el foco en el campo.

### Borrador (DraftSheet)
Papel blanco con borde negro y sombra dura, que sube sobre la barra de entrada con el muelle 300/30. Su cabecera es micro («Borrador · revisa antes de guardar» y el tipo). Todos los campos se editan en el sitio y nada se guarda hasta pulsar GUARDAR. El foco inicial va al primer campo y Escape descarta. Tiene una altura máxima de `min(68dvh, 42rem)` y se desplaza por dentro: **la fila GUARDAR · DESCARTAR es fija al pie**, sobre papel y con un borde superior negro de 2 px, para que las dos acciones estén siempre a la vista, también con el teclado abierto.

### Estados vacíos y de carga
El estado vacío enseña a registrar sin disculparse: una raya hollín superior de 2 px, texto body ceniza de 65ch como máximo y acciones que rellenan la barra de entrada con un ejemplo. Los esqueletos son bloques planos, sin brillo animado.

### Motion
Muelle de lámina 300/30 (asienta en 0,31 s), muestreado a `linear()` para las View Transitions de 400 ms: la lámina entra 32 px (24 px en móvil) desde el lado de su pestaña. Las salidas duran 200 ms con `cubic-bezier(0.23, 1, 0.32, 1)`: siempre son más rápidas que las entradas. El muelle rápido es 700/50. El color nunca se anima. Con movimiento reducido queda un fundido de 120/80 ms sin desplazamiento, y el pulso de grabación y el cursor parpadeante solo corren con `motion-safe`.

Desde la 1.4, el movimiento también explica estados:
- Las pestañas de la barra salen del borde en cascada de 60 ms al cargar y suben al pasar por encima (muelle 500/38).
- Su nombre aparece encima con un muelle rápido.
- La ficha crece desde el borde con `springSheet` y se recoge en 200 ms. El naranja de encendido cambia sin transición.
- El punto de presencia se llena o se vacía, y el tachado de «Sin conexión» se traza.
- La ✓ de guardado se dibuja.
- La barra de confianza del borrador se llena.
- Los mensajes nuevos del chat suben 8 px.
- La cifra protagonista rueda 700 ms hasta su valor nuevo solo cuando cambia con la lámina abierta (al guardar); al entrar en una pestaña no se anima.

## Do's and Don'ts

### Do:
- **Do** usar solo los diez colores del sistema. La paleta de Tailwind se elimina (`--color-*: initial`), igual que los radios y las sombras suaves.
- **Do** marcar cada superficie con `data-surface` (`canvas`, `folder`, `paper`) y dejar que ella decida la tinta de sombra, el anillo de foco, `color-scheme` y el color de los controles.
- **Do** dar a cada lámina una sola cifra protagonista, ajustada a la línea con tope de 15rem.
- **Do** acompañar todo color de señal con glifo y texto, en recuadro de 2 px.
- **Do** medir cada control al menos 44 × 44 px y mantener los inputs a 16 px.
- **Do** mantener GUARDAR y DESCARTAR siempre visibles en los borradores (fila fija al pie).
- **Do** mostrar el nombre de todas las pestañas también en móvil.
- **Do** dar a cada función de la barra de entrada su propia pestaña y su propia ficha, sin interruptores de modo.
- **Do** recalibrar `--numeral-tracking` y `--glyph-em` midiendo en el navegador al cambiar la cara display.

### Don't:
- **Don't** redondear esquinas ni usar un borde que no sea de 0 o 2 px. La única curva es el punto de estado.
- **Don't** usar degradados, transparencias, desenfoques ni sombras con desenfoque.
- **Don't** poner una sombra negra bajo un bloque negro relleno sobre papel.
- **Don't** usar el naranja como relleno o decoración dentro de la carpeta, ni para significar «negativo».
- **Don't** pintar de blanco una ficha de datos: el papel es solo para escribir o decidir.
- **Don't** poner texto blanco pequeño sobre naranja (3,57:1). Sobre la mesa, el texto es negro.
- **Don't** usar ceniza ni rosa como texto sobre papel.
- **Don't** animar el color, ni animar la entrada de la lámina más allá de su transición.
- **Don't** meter controles dentro de una ficha que ya es un enlace.
