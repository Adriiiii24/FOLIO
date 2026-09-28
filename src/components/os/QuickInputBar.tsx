'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import type { TabSlug } from '@/config/tabs';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { easeOutStrong, exitFast, springSheet, springSnap, springTab } from '@/lib/motion/tokens';

export type QuickMode = 'log' | 'ask';
export type QuickTool = QuickMode | 'photo' | 'voice';

export type QuickStatus =
  | { kind: 'idle' }
  | { kind: 'recording'; seconds: number }
  | { kind: 'uploading' }
  | { kind: 'processing'; label: string }
  | { kind: 'error'; message: string }
  /** Aviso que no es un error: «¿Ticket o plato?», lo que menciona una nota de voz… */
  | { kind: 'notice'; message: string }
  /** Hay un borrador encima de la barra esperando confirmación. */
  | { kind: 'draft' }
  /** Recién guardado: el aviso ofrece DESHACER durante unos segundos (§5.7). */
  | { kind: 'saved'; message: string; undoable: boolean };

type QuickInputBarProps = {
  context: TabSlug;
  status: QuickStatus;
  /** La ficha abierta, o null con las cuatro pestañas enterradas. */
  tool: QuickTool | null;
  onOpen: (tool: QuickTool) => void;
  onClose: () => void;
  /** Sin nada en curso ni borrador pendiente: la ficha se puede cerrar o cambiar por otra. */
  canClose: boolean;
  /** Lo que flota encima de las pestañas: el borrador pendiente o la conversación de PREGUNTAR. */
  above?: ReactNode;
  /** Devuelve false si el texto no se ha podido usar: entonces se conserva en la ficha. */
  onText: (mode: QuickMode, text: string) => boolean | Promise<boolean>;
  onImage: (file: File) => void;
  onToggleRecording: () => void;
  onCancelRecording: () => void;
  onRetry?: () => void;
  onUndo?: () => void;
  /** Acciones de la fila de estado que decide el contenedor (elegir ticket o plato, registrar lo mencionado). */
  statusActions?: { label: string; onClick: () => void }[];
  /** Qué entradas hay. Sin IA (Fase 2) solo queda REGISTRAR; en la Fase 3, las cuatro. */
  capabilities?: { ask?: boolean; photo?: boolean; voice?: boolean };
};

const TOOLS: { id: QuickTool; label: string; icon: IconName }[] = [
  { id: 'log', label: 'Registrar', icon: 'pencil' },
  { id: 'ask', label: 'Preguntar', icon: 'ask' },
  { id: 'photo', label: 'Foto', icon: 'camera' },
  { id: 'voice', label: 'Voz', icon: 'mic' },
];

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

const PHOTO_HINT: Partial<Record<TabSlug, string>> = {
  vault: 'Haz o elige la foto del ticket. Revisarás el gasto antes de guardarlo.',
  nutrition: 'Haz o elige la foto del plato. Revisarás la comida antes de guardarla.',
};

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

// Posición vertical de cada pestaña (px hacia abajo; la caja mide 48). Con puntero fino asoman 34 px y al pasar
// por encima salen enteras; en táctil no hay hover, así que asoman 44. Nunca flotan: su base es el borde del que
// salen (la pantalla o, con la ficha abierta, el borde superior de la ficha, tras el que se entierran las demás).
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const TAB_HIDDEN = 56;

function tabY({ open, active, lifted, fine }: { open: boolean; active: boolean; lifted: boolean; fine: boolean }) {
  if (lifted || (open && active)) return 0;
  if (open) return 12;
  return fine ? 14 : 4;
}

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const STATUS_ACTION = 'min-h-6 px-1 font-mono text-micro text-black uppercase underline underline-offset-4';

/**
 * La barra de entrada (§5.6): cuatro pestañas troqueladas de papel, solo con el icono, enterradas en el borde
 * inferior. Al pasar por encima, la pestaña sube, se enciende en naranja y dice su nombre; al pulsarla, sale su
 * ficha con solo esa función y las pestañas viajan encima. Nada se guarda sin un borrador confirmado.
 */
export function QuickInputBar({
  context,
  status,
  tool,
  onOpen,
  onClose,
  canClose,
  above,
  onText,
  onImage,
  onToggleRecording,
  onCancelRecording,
  onRetry,
  onUndo,
  statusActions = [],
  capabilities = {},
}: QuickInputBarProps) {
  const { ask: canAsk = true, photo: canPhoto = true, voice: canVoice = true } = capabilities;
  const tools = TOOLS.filter(
    ({ id }) => (id !== 'ask' || canAsk) && (id !== 'photo' || canPhoto) && (id !== 'voice' || canVoice),
  );
  // Lo escrito en cada ficha se conserva al cerrarla y al cambiar de pestaña.
  const [texts, setTexts] = useState<Record<QuickMode, string>>({ log: '', ask: '' });
  const [lifted, setLifted] = useState<QuickTool | null>(null);
  const [entered, setEntered] = useState(false);
  const fine = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false,
  );
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const tabs = useRef<Partial<Record<QuickTool, HTMLButtonElement | null>>>({});
  const cardId = useId();
  const statusId = useId();

  const recording = status.kind === 'recording';
  const busy = status.kind === 'uploading' || status.kind === 'processing';
  const mode: QuickMode | null = tool === 'log' || tool === 'ask' ? tool : null;
  const text = mode ? texts[mode] : '';
  const hasText = text.trim().length > 0;

  // Las pestañas salen del borde una tras otra al cargar; después, cada cambio va sin retardo.
  useEffect(() => {
    const done = setTimeout(() => setEntered(true), 800);
    return () => clearTimeout(done);
  }, []);

  /** Abre una ficha dentro del gesto: el foco del campo y el selector de fotos lo exigen (iOS). */
  function open(next: QuickTool) {
    if (tool !== null && tool !== next && !canClose) return;
    if (tool !== next) flushSync(() => onOpen(next));
    if (next === 'log' || next === 'ask') input.current?.focus();
    if (next === 'photo') fileInput.current?.click();
  }

  function close() {
    if (!canClose && !recording) return;
    const current = tool;
    if (recording) onCancelRecording();
    onClose();
    if (current) tabs.current[current]?.focus({ preventScroll: true });
  }

  // Los ejemplos de los estados vacíos y las acciones del briefing escriben aquí: `folio:prefill` con el
  // texto en `detail`, o { text, ask: true } para PREGUNTAR. `folio:quick` abre una ficha (atajo «/»).
  const onPrefill = useEffectEvent((event: Event) => {
    const detail = (event as CustomEvent<string | { text?: unknown; ask?: unknown }>).detail;
    const value = typeof detail === 'string' ? detail : detail?.text;
    if (typeof value !== 'string') return;
    const target: QuickMode = canAsk && typeof detail === 'object' && detail?.ask === true ? 'ask' : 'log';
    setTexts((current) => ({ ...current, [target]: value }));
    open(target);
  });
  const onQuick = useEffectEvent((event: Event) => {
    const next = (event as CustomEvent<unknown>).detail;
    if (tools.some(({ id }) => id === next)) open(next as QuickTool);
  });
  useEffect(() => {
    window.addEventListener('folio:prefill', onPrefill);
    window.addEventListener('folio:quick', onQuick);
    return () => {
      window.removeEventListener('folio:prefill', onPrefill);
      window.removeEventListener('folio:quick', onQuick);
    };
  }, []);

  // Pulsar fuera cierra la ficha solo si no hay nada que perder: ni texto, ni avisos, ni nada en curso.
  const onOutside = useEffectEvent((event: PointerEvent) => {
    const target = event.target as Element | null;
    if (!target || root.current?.contains(target) || target.closest('[data-quick-keep]')) return;
    if (canClose && status.kind === 'idle' && !hasText) onClose();
  });
  useEffect(() => {
    if (!tool) return;
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [tool]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode || !hasText || busy) return;
    // Nunca se pierde lo escrito (§5.6, estado `error`): solo se vacía si el texto se ha podido usar.
    if (await onText(mode, text.trim())) setTexts((current) => ({ ...current, [mode]: '' }));
  }

  const closeButton =
    canClose && !recording ? (
      <button
        type="button"
        onClick={close}
        className="grid size-11 shrink-0 place-items-center text-steel hover:text-black"
      >
        <Icon name="close" className="size-4" />
        <span className="sr-only">Cerrar</span>
      </button>
    ) : null;

  let body: ReactNode = null;
  if (mode) {
    body = (
      <form onSubmit={submit} aria-describedby={statusId} className="flex items-center gap-2">
        <label htmlFor="quick-input" className="sr-only">
          {mode === 'ask' ? 'Pregunta a tu archivador' : 'Registro rápido'}
        </label>
        <input
          ref={input}
          id="quick-input"
          value={text}
          onChange={(event) => setTexts((current) => ({ ...current, [mode]: event.target.value }))}
          placeholder={mode === 'ask' ? 'Pregunta a tu archivador…' : HINTS[context]}
          enterKeyHint={mode === 'ask' ? 'search' : 'send'}
          autoComplete="off"
          className="quick-field h-11 min-w-0 flex-1 bg-transparent px-2 text-body"
        />
        <Button type="submit" tone="primary" surface="paper" disabled={busy || !hasText}>
          Enviar
        </Button>
        {closeButton}
      </form>
    );
  } else if (tool === 'photo') {
    body = (
      <div className="flex items-center gap-2">
        {/* En móvil el botón ya lo dice y la explicación partía la ficha en cuatro líneas. */}
        <p className="hidden min-w-0 flex-1 px-2 text-small text-steel md:block">
          {PHOTO_HINT[context] ?? 'Haz o elige la foto de un ticket o de un plato.'}
        </p>
        <Button
          tone="primary"
          surface="paper"
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="max-md:flex-1"
        >
          <Icon name="camera" className="size-4" />
          Elegir foto
        </Button>
        {closeButton}
      </div>
    );
  } else if (tool === 'voice') {
    body = recording ? (
      <div className="flex items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-2 px-2 font-mono text-label uppercase">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full bg-brand-orange motion-safe:animate-rec-pulse"
          />
          Grabando <span className="tabular-nums">{clock(status.seconds)}</span>
        </p>
        <Button tone="secondary" surface="paper" onClick={onCancelRecording}>
          Cancelar
        </Button>
        <Button tone="primary" surface="paper" onClick={onToggleRecording}>
          Enviar
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <p className="hidden min-w-0 flex-1 px-2 text-small text-steel md:block">
          Di un gasto, una comida o una nota. Revisarás el borrador antes de guardarlo.
        </p>
        <Button tone="primary" surface="paper" onClick={onToggleRecording} disabled={busy} className="max-md:flex-1">
          <Icon name="mic" className="size-4" />
          Grabar
        </Button>
        {closeButton}
      </div>
    );
  }

  const showStatus =
    (status.kind !== 'idle' && status.kind !== 'draft' && status.kind !== 'recording') || statusActions.length > 0;
  const statusKey =
    status.kind === 'processing'
      ? status.label
      : 'message' in status
        ? `${status.kind}:${status.message}`
        : status.kind;

  return (
    <div
      ref={root}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl flex-col px-2 md:px-0"
    >
      <AnimatePresence initial={false}>
        {above ? (
          <m.div
            key="above"
            // Hueco para el nombre que aparece sobre una pestaña: nunca tapa GUARDAR ni DESCARTAR.
            className="pointer-events-auto mb-9"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: exitFast }}
            transition={springSheet}
          >
            {above}
          </m.div>
        ) : null}
      </AnimatePresence>

      <div role="group" aria-label="Entrada rápida" className="quick-tabs">
        {tools.map((entry, index) => {
          const active = tool === entry.id;
          const isLifted = lifted === entry.id;
          const y = tabY({ open: tool !== null, active, lifted: isLifted, fine });
          // Un solo nombre a la vista: el de la pestaña señalada o, si no hay ninguna, el de la ficha abierta.
          const named = isLifted || (active && lifted === null);
          return (
            <m.button
              key={entry.id}
              ref={(element) => {
                tabs.current[entry.id] = element;
              }}
              type="button"
              aria-label={entry.label}
              aria-expanded={active}
              aria-controls={active ? cardId : undefined}
              data-lit={active || isLifted || undefined}
              className="quick-tab"
              style={{ zIndex: named ? 30 : undefined }}
              initial={{ y: TAB_HIDDEN }}
              animate={{ y }}
              whileTap={{ y: y + 3 }}
              transition={{ ...springTab, delay: entered ? 0 : 0.2 + index * 0.06 }}
              onHoverStart={() => setLifted(entry.id)}
              onHoverEnd={() => setLifted((current) => (current === entry.id ? null : current))}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) setLifted(entry.id);
              }}
              onBlur={() => setLifted((current) => (current === entry.id ? null : current))}
              onClick={() => (active ? close() : open(entry.id))}
            >
              <Icon name={entry.icon} className="size-5 *:[vector-effect:non-scaling-stroke]" />
              <AnimatePresence>
                {named ? (
                  <m.span
                    key="name"
                    aria-hidden="true"
                    className="quick-tab__name"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3, transition: exitFast }}
                    transition={springSnap}
                  >
                    {entry.label}
                  </m.span>
                ) : null}
              </AnimatePresence>
            </m.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {tool ? (
          <m.div
            key="card"
            className="pointer-events-auto relative z-10 overflow-hidden shadow-hard"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0, transition: { duration: 0.2, ease: easeOutStrong } }}
            transition={springSheet}
          >
            <div
              id={cardId}
              data-surface="paper"
              onKeyDown={(event) => {
                if (event.key === 'Escape') close();
              }}
              className="border-2 border-black bg-white p-2"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <m.div
                  key={tool}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.16, ease: easeOutStrong } }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                >
                  {body}
                </m.div>
              </AnimatePresence>

              <m.div
                initial={false}
                animate={{ height: showStatus ? 'auto' : 0, opacity: showStatus ? 1 : 0 }}
                transition={springSnap}
                className="overflow-hidden"
              >
                <div className="mt-2 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-black px-2 pt-2">
                  <p
                    id={statusId}
                    role="status"
                    className={`font-mono text-micro uppercase ${status.kind === 'error' ? 'font-semibold text-black' : status.kind === 'saved' ? 'text-black' : 'text-steel'}`}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <m.span
                        key={statusKey}
                        className="inline-flex items-center gap-1.5"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4, transition: exitFast }}
                        transition={springSnap}
                      >
                        {status.kind === 'recording' && <span className="sr-only">Grabando</span>}
                        {status.kind === 'uploading' && 'Subiendo…'}
                        {status.kind === 'processing' && (
                          <>
                            {status.label}
                            <span aria-hidden="true" className="-ml-1.5 motion-safe:animate-caret-blink">
                              _
                            </span>
                          </>
                        )}
                        {status.kind === 'error' && (
                          <>
                            <span aria-hidden="true">!</span>
                            {status.message}
                          </>
                        )}
                        {status.kind === 'notice' && status.message}
                        {/* El borrador ya lo dice a la vista; aquí solo se anuncia a los lectores de pantalla. */}
                        {status.kind === 'draft' && (
                          <span className="sr-only">Borrador abierto: revisa y confirma</span>
                        )}
                        {status.kind === 'saved' && (
                          <>
                            <SavedCheck />
                            {status.message}
                          </>
                        )}
                      </m.span>
                    </AnimatePresence>
                  </p>
                  {status.kind === 'saved' && status.undoable && onUndo ? (
                    <button type="button" onClick={onUndo} className={STATUS_ACTION}>
                      Deshacer
                    </button>
                  ) : null}
                  {statusActions.map((action) => (
                    <button key={action.label} type="button" onClick={action.onClick} className={STATUS_ACTION}>
                      {action.label}
                    </button>
                  ))}
                  {status.kind === 'error' && onRetry ? (
                    <button type="button" onClick={onRetry} className={STATUS_ACTION}>
                      Reintentar
                    </button>
                  ) : null}
                </div>
              </m.div>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* En móviles con barra de inicio, las pestañas se entierran bajo esta franja y no bajo el gesto del sistema. */}
      <div aria-hidden="true" className="relative z-20 h-[env(safe-area-inset-bottom)] bg-black" />

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
    </div>
  );
}

/** Confirmación de guardado: la marca se traza en vez de aparecer de golpe. */
function SavedCheck() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <m.path
        d="M2.5 8.5 6.5 12.5 13.5 4.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: easeOutStrong, delay: 0.06 }}
      />
    </svg>
  );
}
