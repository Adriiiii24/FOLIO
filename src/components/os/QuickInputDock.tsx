'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { tabForPath } from '@/config/tabs';
import { interpretQuickText, type InterpretedDraft } from '@/modules/quick/actions';
import { DraftSheet, type Undo } from './DraftSheet';
import { QuickInputBar, type QuickMode, type QuickStatus } from './QuickInputBar';

const AI_LATER = {
  ask: 'Las preguntas llegarán con la IA. De momento, desactiva PREGUNTAR y FOLIO registrará lo que escribas.',
  photo: 'Leer tickets y platos por foto llegará con la IA. De momento, escribe el gasto: «12,40 Mercadona».',
  voice: 'El dictado llegará con la IA. De momento, escribe lo que quieras registrar.',
};

/**
 * Conecta la barra de entrada (§5.6) con el intérprete y con las acciones de cada módulo.
 * Fase 2: solo texto, interpretado sin IA. Foto, voz y preguntas lo dicen claramente en vez de fallar.
 */
export function QuickInputDock() {
  const pathname = usePathname();
  const context = tabForPath(pathname)?.slug ?? 'home';
  const [status, setStatus] = useState<QuickStatus>({ kind: 'idle' });
  const [draft, setDraft] = useState<InterpretedDraft | null>(null);
  // Cada borrador nuevo monta un formulario nuevo: sus campos no controlados toman los valores iniciales.
  const [draftKey, setDraftKey] = useState(0);
  const undoRef = useRef<Undo | null>(null);
  const lastText = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const settleAfter = (ms: number) => {
    clearTimer();
    timer.current = setTimeout(() => {
      setStatus({ kind: 'idle' });
      undoRef.current = null;
    }, ms);
  };
  useEffect(() => clearTimer, []);

  async function onText(mode: QuickMode, text: string): Promise<boolean> {
    if (mode === 'ask') {
      setStatus({ kind: 'error', message: AI_LATER.ask });
      return false;
    }
    clearTimer();
    setStatus({ kind: 'processing', label: 'Interpretando' });
    try {
      const result = await interpretQuickText(context, text);
      if (!result.ok) {
        setStatus({ kind: 'error', message: result.message });
        return false;
      }
      lastText.current = text;
      setDraft(result.draft);
      setDraftKey((key) => key + 1);
      setStatus({ kind: 'draft' });
      return true;
    } catch {
      setStatus({ kind: 'error', message: 'No se ha podido interpretar. Revisa la conexión e inténtalo de nuevo.' });
      return false;
    }
  }

  function onSaved(message: string, undo: Undo | null) {
    setDraft(null);
    undoRef.current = undo;
    setStatus({ kind: 'saved', message, undoable: Boolean(undo) });
    settleAfter(5000);
    document.getElementById('quick-input')?.focus();
  }

  async function onUndo() {
    const undo = undoRef.current;
    if (!undo) return;
    undoRef.current = null;
    clearTimer();
    setStatus({ kind: 'processing', label: 'Deshaciendo' });
    const result = await undo();
    setStatus(
      result.status === 'error'
        ? { kind: 'error', message: result.message }
        : { kind: 'saved', message: 'Deshecho.', undoable: false },
    );
    settleAfter(3000);
  }

  function onDiscard() {
    setDraft(null);
    setStatus({ kind: 'idle' });
    // Descartar el borrador no borra lo escrito: vuelve a la barra para corregirlo.
    window.dispatchEvent(new CustomEvent('folio:prefill', { detail: lastText.current }));
  }

  return (
    <QuickInputBar
      context={context}
      status={status}
      draft={draft ? <DraftSheet key={draftKey} draft={draft} onSaved={onSaved} onDiscard={onDiscard} /> : undefined}
      onText={onText}
      onImage={() => setStatus({ kind: 'error', message: AI_LATER.photo })}
      onToggleRecording={() => setStatus({ kind: 'error', message: AI_LATER.voice })}
      onUndo={onUndo}
      // Fase 2: solo texto (PROPOSAL §5). Preguntar, foto y voz vuelven con la IA en la Fase 3.
      capabilities={{ ask: false, photo: false, voice: false }}
    />
  );
}
