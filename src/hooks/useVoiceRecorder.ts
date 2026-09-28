'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Chrome graba WebM/Opus; Firefox, Ogg/Opus o WebM; Safari, MP4/AAC. Gemini acepta los tres.
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
export const MAX_RECORDING_SECONDS = 180;

/**
 * Graba del micrófono hasta ENVIAR (`stop`) o 180 s; CANCELAR (`cancel`) apaga el micrófono sin entregar nada. `seconds` avanza con un intervalo; el micrófono se apaga
 * al terminar (el indicador del sistema desaparece) y también si el componente se desmonta grabando.
 */
export function useVoiceRecorder(onDone: (audio: Blob, seconds: number) => void) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    const media = recorder.current;
    if (!media) return;
    media.onstop = () => {
      for (const track of media.stream.getTracks()) track.stop();
      recorder.current = null;
      setSeconds(null);
    };
    if (media.state === 'recording') media.stop();
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    const media = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const startedAt = Date.now();

    media.ondataavailable = (event) => chunks.push(event.data);
    media.onstop = () => {
      for (const track of stream.getTracks()) track.stop();
      recorder.current = null;
      setSeconds(null);
      done.current(new Blob(chunks, { type: media.mimeType }), Math.round((Date.now() - startedAt) / 1000));
    };

    media.start();
    recorder.current = media;
    setSeconds(0);
  }, []);

  const recording = seconds !== null;
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((value) => (value === null ? null : value + 1)), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (seconds !== null && seconds >= MAX_RECORDING_SECONDS) stop();
  }, [seconds, stop]);

  // Al desmontar grabando, se apaga el micrófono sin entregar el audio.
  useEffect(
    () => () => {
      const media = recorder.current;
      if (!media) return;
      media.onstop = null;
      if (media.state === 'recording') media.stop();
      for (const track of media.stream.getTracks()) track.stop();
    },
    [],
  );

  return { recording, seconds: seconds ?? 0, start, stop, cancel };
}
