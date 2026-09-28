'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChatPanel, type FolioMessage } from '@/components/chat/ChatPanel';
import { tabForPath, type TabSlug } from '@/config/tabs';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { compressImage } from '@/lib/media/compress-image';
import { uploadToBucket } from '@/lib/media/upload';
import { interpretQuickText } from '@/modules/quick/actions';
import { discardUpload, extractPhoto, interpretVoice } from '@/modules/quick/capture';
import type { AiDraftInfo, InterpretedDraft } from '@/modules/quick/types';
import { DraftSheet, type Undo } from './DraftSheet';
import { QuickInputBar, type QuickMode, type QuickStatus, type QuickTool } from './QuickInputBar';

const PHOTO_KIND: Partial<Record<TabSlug, 'receipt' | 'meal'>> = { vault: 'receipt', nutrition: 'meal' };

type FollowUp = AiDraftInfo['followUps'][number];

const chatTransport = new DefaultChatTransport<FolioMessage>({ api: '/api/chat' });

/**
 * Antes de responder, la ruta del chat devuelve {error} en JSON (sesión, tope); durante el stream, un texto
 * ya traducido (saturada, cuota agotada). Cualquier otra cosa es un fallo de red.
 */
function chatErrorText(error: Error | undefined): string | null {
  if (!error) return null;
  try {
    const body = JSON.parse(error.message) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    if (/^(La IA|No se|Has usado|Tu sesión)/.test(error.message)) return error.message;
  }
  return 'No se ha podido responder. Revisa la conexión y prueba otra vez.';
}

/**
 * Conecta la barra de entrada (§5.6) con el intérprete de texto, la lectura de fotos y la voz. Decide qué
 * ficha está abierta. Todo acaba en un borrador que la persona revisa: nada se guarda sin confirmar.
 */
export function QuickInputDock() {
  const pathname = usePathname();
  const context = tabForPath(pathname)?.slug ?? 'home';
  // La ficha abierta de la barra; null con las pestañas enterradas.
  const [tool, setTool] = useState<QuickTool | null>(null);
  const [status, setStatus] = useState<QuickStatus>({ kind: 'idle' });
  const [draft, setDraft] = useState<InterpretedDraft | null>(null);
  // Cada borrador nuevo monta un formulario nuevo: sus campos no controlados toman los valores iniciales.
  const [draftKey, setDraftKey] = useState(0);
  // Foto fuera de VAULT y NUTRITION: espera a que la persona diga si es un ticket o un plato.
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  // Registros que menciona una nota de voz: se ofrecen de uno en uno después de guardarla.
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  // PREGUNTAR: la conversación vive en el contenedor, así que sobrevive a los cambios de pestaña y a cerrar la ficha.
  const [chatOpen, setChatOpen] = useState(false);
  const chat = useChat<FolioMessage>({ transport: chatTransport });
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

  const prefill = (text: string) => window.dispatchEvent(new CustomEvent('folio:prefill', { detail: text }));

  function begin(next: QuickStatus) {
    clearTimer();
    setRetry(null);
    setPendingPhoto(null);
    setStatus(next);
  }

  function fail(message: string, again?: () => void) {
    setStatus({ kind: 'error', message });
    setRetry(again ? () => again : null);
  }

  function showDraft(next: InterpretedDraft, text: string) {
    lastText.current = text;
    setDraft(next);
    setDraftKey((key) => key + 1);
    setStatus({ kind: 'draft' });
  }

  async function onText(mode: QuickMode, text: string, tab: TabSlug = context): Promise<boolean> {
    if (mode === 'ask') {
      if (draft) {
        fail('Primero guarda o descarta el borrador.');
        return false;
      }
      if (chat.status === 'submitted' || chat.status === 'streaming') return false;
      begin({ kind: 'idle' });
      setChatOpen(true);
      void chat.sendMessage({ text });
      return true;
    }
    begin({ kind: 'processing', label: 'Interpretando' });
    try {
      const result = await interpretQuickText(tab, text);
      if (!result.ok) {
        fail(result.message);
        return false;
      }
      showDraft(result.draft, text);
      return true;
    } catch {
      fail('No se ha podido interpretar. Revisa la conexión e inténtalo de nuevo.');
      return false;
    }
  }

  async function readPhoto(kind: 'receipt' | 'meal', file: File) {
    const bucket = kind === 'receipt' ? 'receipts' : 'meal-photos';
    const again = () => void readPhoto(kind, file);
    begin({ kind: 'uploading' });
    let path: string | null = null;
    try {
      path = await uploadToBucket(bucket, await compressImage(file));
      setStatus({ kind: 'processing', label: kind === 'receipt' ? 'Leyendo el ticket' : 'Leyendo el plato' });
      const result = await extractPhoto(kind, path);
      if (!result.ok) {
        void discardUpload(bucket, path);
        fail(result.message, again);
        return;
      }
      showDraft(result.draft, '');
    } catch {
      if (path) void discardUpload(bucket, path);
      fail('No se ha podido subir la foto. Revisa la conexión e inténtalo de nuevo.', again);
    }
  }

  function onImage(file: File) {
    const kind = PHOTO_KIND[context];
    if (kind) {
      void readPhoto(kind, file);
      return;
    }
    begin({ kind: 'notice', message: '¿Ticket o plato?' });
    setPendingPhoto(file);
  }

  async function onAudio(audio: Blob, seconds: number) {
    const again = () => void onAudio(audio, seconds);
    if (seconds < 1 || audio.size === 0) {
      fail('La grabación es demasiado corta. Pulsa GRABAR, habla y pulsa ENVIAR.');
      return;
    }
    begin({ kind: 'uploading' });
    try {
      const path = await uploadToBucket('voice-notes', audio);
      setStatus({ kind: 'processing', label: 'Escuchando' });
      const result = await interpretVoice({ tab: context, path, durationS: seconds });
      if (!result.ok) {
        if (result.prefill) prefill(result.prefill);
        fail(result.message, result.prefill ? undefined : again);
        return;
      }
      setFollowUps(result.draft.ai?.followUps ?? []);
      showDraft(result.draft, '');
    } catch {
      fail('No se ha podido enviar el audio. Revisa la conexión e inténtalo de nuevo.', again);
    }
  }

  const recorder = useVoiceRecorder((audio, seconds) => void onAudio(audio, seconds));

  function onToggleRecording() {
    if (recorder.recording) recorder.stop();
    else void startRecording();
  }

  async function startRecording() {
    begin({ kind: 'idle' });
    try {
      await recorder.start();
    } catch {
      fail('No hay acceso al micrófono. Permítelo en el navegador o escribe el registro.');
    }
  }

  function reset() {
    clearTimer();
    setRetry(null);
    setPendingPhoto(null);
    setFollowUps([]);
    setStatus({ kind: 'idle' });
    undoRef.current = null;
  }

  const busy = status.kind === 'uploading' || status.kind === 'processing';
  const canClose = !busy && !draft;

  /** Cambiar de ficha deja atrás lo que quedaba de la anterior (avisos, una grabación a medias). */
  function openTool(next: QuickTool) {
    if (next === tool) return;
    if (recorder.recording) recorder.cancel();
    if (tool !== null) reset();
    setTool(next);
    // VOZ graba al pulsarla: un gesto. CANCELAR apaga el micrófono sin enviar nada.
    if (next === 'voice') void startRecording();
  }

  function closeTool() {
    if (!canClose) return;
    if (recorder.recording) recorder.cancel();
    reset();
    setTool(null);
  }

  function onSaved(message: string, undo: Undo | null) {
    setDraft(null);
    undoRef.current = undo;
    setStatus({ kind: 'saved', message, undoable: Boolean(undo) });
    // Con registros mencionados pendientes, el aviso se queda hasta que la persona decida.
    if (followUps.length === 0) settleAfter(5000);
    document.getElementById('quick-input')?.focus();
  }

  async function onUndo() {
    const undo = undoRef.current;
    if (!undo) return;
    undoRef.current = null;
    begin({ kind: 'processing', label: 'Deshaciendo' });
    const result = await undo();
    setStatus(
      result.status === 'error'
        ? { kind: 'error', message: result.message }
        : { kind: 'saved', message: 'Deshecho.', undoable: false },
    );
    settleAfter(3000);
  }

  function onDiscard() {
    const upload = draft?.ai?.upload;
    if (upload) void discardUpload(upload.bucket, upload.path);
    setDraft(null);
    setFollowUps([]);
    setStatus({ kind: 'idle' });
    // Descartar el borrador no borra lo escrito: vuelve a la barra para corregirlo.
    if (lastText.current) prefill(lastText.current);
  }

  const next = followUps[0];
  const statusActions =
    pendingPhoto && status.kind === 'notice'
      ? [
          { label: 'Ticket', onClick: () => void readPhoto('receipt', pendingPhoto) },
          { label: 'Plato', onClick: () => void readPhoto('meal', pendingPhoto) },
          { label: 'Cancelar', onClick: () => begin({ kind: 'idle' }) },
        ]
      : next && status.kind === 'saved'
        ? [
            {
              label: `Registrar: ${next.command}`,
              onClick: () => {
                setFollowUps((queue) => queue.slice(1));
                // Las órdenes mencionadas pueden ser de cualquier módulo: HOME prueba todos los prefijos.
                void onText('log', next.command, 'home');
              },
            },
            { label: 'Ahora no', onClick: () => (setFollowUps([]), setStatus({ kind: 'idle' })) },
          ]
        : [];

  return (
    <QuickInputBar
      context={context}
      status={recorder.recording ? { kind: 'recording', seconds: recorder.seconds } : status}
      tool={tool}
      onOpen={openTool}
      onClose={closeTool}
      canClose={canClose}
      above={
        draft ? (
          <DraftSheet key={draftKey} draft={draft} onSaved={onSaved} onDiscard={onDiscard} />
        ) : chatOpen && tool === 'ask' ? (
          <ChatPanel
            messages={chat.messages}
            status={chat.status}
            error={chatErrorText(chat.error)}
            onStop={() => void chat.stop()}
            onClose={() => {
              void chat.stop();
              chat.setMessages([]);
              chat.clearError();
              setChatOpen(false);
              document.getElementById('quick-input')?.focus();
            }}
          />
        ) : undefined
      }
      onText={(mode, text) => onText(mode, text)}
      onImage={onImage}
      onToggleRecording={onToggleRecording}
      onCancelRecording={() => recorder.cancel()}
      onRetry={retry ?? undefined}
      onUndo={onUndo}
      statusActions={statusActions}
      capabilities={{ ask: true, photo: true, voice: true }}
    />
  );
}
