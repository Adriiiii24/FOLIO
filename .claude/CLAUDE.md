# DOSSIER_OS

Proyecto doc-first: el diseño completo está en `docs/` y todavía no hay código (estado a 2026-09-27).

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

- Siguiente: Fase 1 (Setup & Auth), PROPOSAL §5.
- Esta carpeta está dentro del repositorio git de `C:\Users\adrmp`, así que `create-next-app` no ejecutará `git init`. Antes de hacer scaffold, confírmalo con el usuario y ejecuta `git init` aquí.
- `create-next-app` acepta `docs/` y `.claude/` en una carpeta no vacía. No crees otros archivos en la raíz antes del scaffold.
- `docs/reference/referencia-22-98.png` parece la imagen promocional de un mockup comercial: no debe llegar a un repositorio público. Tras el scaffold, añade `docs/reference/` al `.gitignore`.
- Para la UI (Fase 2), Impeccable pedirá un `PRODUCT.md`; usa PROPOSAL.md como base.
