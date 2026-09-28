---
version: 1
slug: 'src-app-os-layout-tsx'
primary_target: 'src/app/(os)/layout.tsx'
related_targets: []
---

Scope: the authenticated app, meaning the folder shell (`src/app/(os)/layout.tsx`) and the eight module sheets under it. Visitor mode: Operate.

Audience and job: the author, on a phone mid-task (between sets, at the checkout, in bed), and portfolio visitors arriving with an empty account. The job is to log in one gesture, read the one number that matters in half a second, and edit or delete any record by hand. AI arrives in Phase 3; in Phase 2 the quick bar parses text deterministically into a draft.

Constraints: `docs/DESIGN_SYSTEM.md` is normative (tokens, components, motion); the brief pins the world, so there was no concept roll. The display face is Helvetica Now Display, with a self-hosted temporary stand-in until the author supplies licensed files.

Unresolved: the AI budget for visitors, sample data for empty accounts, and the licensed font files.

## Direction contract

THESIS: A physical filing cabinet run as an operating system. An orange desk, a black open folder, an index tab per area, one poster-sized figure per sheet, and white paper only where the user must write or decide. It refuses the category-default dashboard of rounded cards, a sidebar and pastel charts.

OWN-WORLD: The orange canvas #FF3B00 carries the system bar and the die-cut trapezoid tabs; the folder is #000; data cards are #121212 with 2px borders. Radii are zero and shadows are hard 4px offsets in the ink of the surface underneath. Labels are uppercase mono at 11–12px with open tracking, figures are condensed and tight, and signal colours always carry a glyph.

STORY: Visitors understand in one viewport that each tab is a folder of their life, see the headline number, log something from the bar, and trust it because every write is a confirmable draft.

FIRST VIEWPORT: The orange band holds the system bar (FOLIO, local date and time, status dot) and the eight-tab strip, with the active tab raised and fused into the black folder. Inside the folder come the sheet header (● 03 // FINANZAS · MES EN CURSO), the display numeral spanning the width with its caption, and cards on a 4/8/12-column grid. Four icon-only, die-cut paper tabs (REGISTRAR, PREGUNTAR, FOTO, VOZ) sit buried in the bottom edge; hovering lifts one, lights it orange and shows its name, and pressing it pulls out its single-function card (DESIGN_SYSTEM 1.4).

FORM: Pinned by the brief (DESIGN_SYSTEM.md), with no roll. Signature interaction: the sheet slides in from the side its folder sits on, with a 300/30 spring in a View Transition; keyboard switches stay instant. Seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
