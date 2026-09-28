import type { QuickDraft } from './parse';

export type DraftContext = {
  /** Fecha y hora local ('YYYY-MM-DDTHH:mm') en la zona del perfil. */
  now: string;
  today: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  currency: string;
  habitExists: boolean;
};

export type UploadBucket = 'receipts' | 'meal-photos' | 'voice-notes';

/** Lo que un borrador de IA añade al de texto: de dónde viene, cuánto se fía el modelo y qué avisa. */
export type AiDraftInfo = {
  origin: 'Ticket' | 'Foto' | 'Voz';
  confidence: number | null;
  warnings: string[];
  /** Lo que la IA ha oído, cuando el borrador no lo enseña ya (una orden dicha en voz alta). */
  heard: string | null;
  /** JSON de AiMetaInput para el campo oculto `ai` del formulario; null si el registro no lo guarda. */
  meta: string | null;
  /** El archivo subido: si se descarta el borrador, se borra de Storage. */
  upload: { bucket: UploadBucket; path: string } | null;
  /** Registros que la nota de voz menciona, como órdenes de la barra, para después de guardar. */
  followUps: { summary: string; command: string }[];
};

export type InterpretedDraft = QuickDraft & { context: DraftContext; ai?: AiDraftInfo };

/** `prefill`: texto que vuelve a la barra para corregirlo (p. ej. lo dicho en una nota de voz). */
export type DraftResult = { ok: true; draft: InterpretedDraft } | { ok: false; message: string; prefill?: string };
