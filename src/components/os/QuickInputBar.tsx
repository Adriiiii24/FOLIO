'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { TabSlug } from '@/config/tabs';
import { Icon } from '@/components/ui/Icon';
import { exitFast, springSheet } from '@/lib/motion/tokens';

export type QuickMode = 'log' | 'ask';

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
  /** Borrador de IA pendiente de confirmar, si lo hay. */
  draft?: ReactNode;
  /** Devuelve false si el texto no se ha podido usar: entonces se conserva en la barra. */
  onText: (mode: QuickMode, text: string) => boolean | Promise<boolean>;
  onImage: (file: File) => void;
  onToggleRecording: () => void;
  onRetry?: () => void;
  onUndo?: () => void;
  /** Acciones de la fila de estado que decide el contenedor (elegir ticket o plato, registrar lo mencionado). */
  statusActions?: { label: string; onClick: () => void }[];
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
  statusActions = [],
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

  // Los ejemplos de los estados vacíos y las acciones del briefing escriben aquí: `folio:prefill` con el
  // texto en `detail`, o { text, ask: true } para dejar la barra en PREGUNTAR.
  useEffect(() => {
    function onPrefill(event: Event) {
      const detail = (event as CustomEvent<string | { text?: unknown; ask?: unknown }>).detail;
      const value = typeof detail === 'string' ? detail : detail?.text;
      if (typeof value !== 'string') return;
      setAsking(canAsk && typeof detail === 'object' && detail?.ask === true);
      setText(value);
      document.getElementById('quick-input')?.focus();
    }
    window.addEventListener('folio:prefill', onPrefill);
    return () => window.removeEventListener('folio:prefill', onPrefill);
  }, [canAsk]);

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
            {/* En móvil, solo el icono: el campo necesita el ancho. El nombre accesible sigue siendo el texto. */}
            <Icon name="ask" className="size-5 md:hidden" />
            <span className="sr-only md:not-sr-only">Preguntar</span>
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
              <Icon name="camera" className="size-5 md:hidden" />
              <span className="sr-only md:not-sr-only">Foto</span>
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
            {recording ? (
              'Parar'
            ) : (
              <>
                <Icon name="mic" className="size-5 md:hidden" />
                <span className="sr-only md:not-sr-only">Voz</span>
              </>
            )}
          </button>
        )}
      </form>

      <div className="mt-1 flex min-h-6 flex-wrap items-center gap-x-3 px-1">
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
          {(status.kind === 'error' || status.kind === 'notice') && status.message}
          {/* El borrador ya lo dice a la vista; aquí solo se anuncia a los lectores de pantalla. */}
          {status.kind === 'draft' && <span className="sr-only">Borrador abierto: revisa y confirma</span>}
          {status.kind === 'saved' && <span className="text-white">{status.message}</span>}
        </p>
        {status.kind === 'saved' && status.undoable && onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="min-h-6 bg-black px-1 font-mono text-micro text-white uppercase underline underline-offset-4"
          >
            Deshacer
          </button>
        ) : null}
        {statusActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="min-h-6 bg-black px-1 font-mono text-micro text-white uppercase underline underline-offset-4"
          >
            {action.label}
          </button>
        ))}
        {status.kind === 'error' && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-6 bg-black px-1 font-mono text-micro text-white uppercase underline underline-offset-4"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
