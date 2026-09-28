'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { TABS, type Tab } from '@/config/tabs';
import { STORAGE_PATH, type AiMetaInput } from '@/lib/ai/draft-meta';
import { AI_MESSAGE, aiFailure, beginAiCall } from '@/lib/ai/guard';
import { MODEL_CHAIN, models, providerOptions, type ModelRoute } from '@/lib/ai/models';
import { MEAL_SYSTEM, RECEIPT_SYSTEM, voiceSystem } from '@/lib/ai/prompts';
import { MealExtractionSchema } from '@/lib/ai/schemas/meal';
import { TicketExtractionSchema } from '@/lib/ai/schemas/ticket';
import { VoiceCaptureSchema } from '@/lib/ai/schemas/voice';
import { errorCode, recordAiRun } from '@/lib/ai/telemetry';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { validateMeal } from '@/modules/nutrition/meal-rules';
import { validateReceipt } from '@/modules/vault/receipt-rules';
import { draftContext } from './context';
import { interpret, type QuickDraft } from './parse';
import type { AiDraftInfo, DraftResult, UploadBucket } from './types';

const BUCKETS = ['receipts', 'meal-photos', 'voice-notes'] as const satisfies readonly UploadBucket[];
const IMAGE_PATH = /\.(webp|jpg|png)$/;
const AUDIO_PATH = /\.(webm|m4a|mp4|ogg)$/;

/** Decimal con coma, como lo escribiría la persona en el formulario. */
const decimal = (value: number) => String(value).replace('.', ',');

const toTab = (tab: string): Tab => TABS.find((entry) => entry.slug === tab) ?? TABS[0];

async function build(draft: QuickDraft, ai: AiDraftInfo): Promise<DraftResult> {
  return { ok: true, draft: { ...draft, context: await draftContext(draft), ai } };
}

/** El modelo que respondió de verdad; si el SDK no lo dice, el primero de la cadena. */
const answeredBy = (route: ModelRoute, modelId: string | undefined) => modelId || MODEL_CHAIN[route][0];

/**
 * Lee una foto ya subida a Storage (ticket o plato) y devuelve un BORRADOR. No escribe nada en el
 * dominio: guardar es la acción del módulo, cuando la persona confirma.
 */
export async function extractPhoto(kind: 'receipt' | 'meal', path: string): Promise<DraftResult> {
  const begin = await beginAiCall();
  if (!begin.ok) return begin;
  const { supabase, userId, profile } = begin;
  if (!STORAGE_PATH.test(path) || !IMAGE_PATH.test(path) || !path.startsWith(`${userId}/`)) {
    return { ok: false, message: AI_MESSAGE.invalid };
  }

  const bucket = kind === 'receipt' ? 'receipts' : 'meal-photos';
  // Descarga con la sesión: las políticas de Storage vuelven a comprobar la carpeta.
  const { data: file, error: downloadError } = await supabase.storage.from(bucket).download(path);
  if (downloadError || !file) return { ok: false, message: AI_MESSAGE.notFound };

  const task = kind === 'receipt' ? 'receipt_extraction' : 'meal_extraction';
  const image = {
    type: 'file' as const,
    mediaType: file.type || 'image/webp',
    data: new Uint8Array(await file.arrayBuffer()),
  };
  const upload = { bucket, path } as const;
  const startedAt = performance.now();
  try {
    if (kind === 'receipt') {
      const { output, usage, response } = await generateText({
        model: models.vision,
        system: RECEIPT_SYSTEM,
        output: Output.object({ schema: TicketExtractionSchema, name: 'ticket' }),
        providerOptions: providerOptions('vision'),
        messages: [{ role: 'user', content: [image, { type: 'text', text: 'Extrae los datos de este ticket.' }] }],
      });
      await recordAiRun(supabase, {
        task,
        model: answeredBy('vision', response.modelId),
        status: 'ok',
        startedAt,
        usage,
      });

      const context = await draftContext({ kind: 'note', values: { content: '' } });
      const receipt = validateReceipt(output, path, { nowLocal: context.now, currency: profile.currency });
      return build(
        {
          kind: 'transaction',
          values: {
            kind: 'expense',
            amount: receipt.amount > 0 ? receipt.amount.toFixed(2).replace('.', ',') : '',
            merchant: receipt.merchant ?? '',
            category: receipt.category,
            paymentMethod: receipt.paymentMethod ?? '',
            occurredAt: receipt.issuedAtLocal ?? context.now,
          },
        },
        {
          origin: 'Ticket',
          confidence: receipt.confidence,
          warnings: receipt.warnings,
          heard: null,
          meta: JSON.stringify(receipt.meta),
          upload,
          followUps: [],
        },
      );
    }

    const { output, usage, response } = await generateText({
      model: models.vision,
      system: MEAL_SYSTEM,
      output: Output.object({ schema: MealExtractionSchema, name: 'plato' }),
      providerOptions: providerOptions('vision'),
      messages: [
        { role: 'user', content: [image, { type: 'text', text: 'Estima el contenido nutricional de este plato.' }] },
      ],
    });
    await recordAiRun(supabase, {
      task,
      model: answeredBy('vision', response.modelId),
      status: 'ok',
      startedAt,
      usage,
    });

    const meal = validateMeal(output, path);
    return build(
      {
        kind: 'meal',
        values: {
          description: meal.description,
          ...(meal.mealType ? { mealType: meal.mealType } : {}),
          caloriesKcal: String(meal.totals.caloriesKcal),
          proteinG: decimal(meal.totals.proteinG),
          carbsG: decimal(meal.totals.carbsG),
          fatG: decimal(meal.totals.fatG),
        },
      },
      {
        origin: 'Foto',
        confidence: meal.confidence,
        warnings: meal.warnings,
        heard: null,
        meta: JSON.stringify(meal.meta),
        upload,
        followUps: [],
      },
    );
  } catch (error) {
    await recordAiRun(supabase, {
      task,
      model: MODEL_CHAIN.vision[0],
      status: 'error',
      startedAt,
      errorCode: errorCode(error),
    });
    return { ok: false, message: aiFailure(error, AI_MESSAGE.photoFailed) };
  }
}

const VoiceInputSchema = z.object({
  tab: z.string().max(20),
  path: z.string().regex(STORAGE_PATH).regex(AUDIO_PATH),
  durationS: z.number().min(0).max(600),
});

const normalizeTags = (tags: string[]) =>
  [...new Set(tags.map((tag) => tag.trim().toLocaleLowerCase('es').replace(/^#/, '')).filter(Boolean))].slice(0, 5);

/**
 * Nota de voz → una sola llamada (transcripción + lectura) → borrador. La pestaña es el contexto
 * (PROPOSAL §2.2): una orden de registro pasa por el mismo analizador que el texto; lo demás es una
 * entrada del diario. El audio solo se conserva si acaba siendo una nota: si no, se borra al momento.
 */
export async function interpretVoice(input: z.input<typeof VoiceInputSchema>): Promise<DraftResult> {
  const parsed = VoiceInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: AI_MESSAGE.invalid };
  const { path, durationS } = parsed.data;
  const tab = toTab(parsed.data.tab);
  const slug = tab.slug;

  const begin = await beginAiCall();
  if (!begin.ok) return begin;
  const { supabase, userId } = begin;
  if (!path.startsWith(`${userId}/`)) return { ok: false, message: AI_MESSAGE.invalid };

  const { data: file, error: downloadError } = await supabase.storage.from('voice-notes').download(path);
  if (downloadError || !file) return { ok: false, message: AI_MESSAGE.notFound };
  const dropAudio = () => supabase.storage.from('voice-notes').remove([path]);

  const startedAt = performance.now();
  let capture;
  try {
    const { output, usage, response } = await generateText({
      model: models.audio,
      system: voiceSystem(`${tab.label} (${tab.name})`),
      output: Output.object({ schema: VoiceCaptureSchema, name: 'nota_de_voz' }),
      providerOptions: providerOptions('audio'),
      messages: [
        {
          role: 'user',
          content: [
            // MediaRecorder etiqueta «audio/webm;codecs=opus»: al modelo le basta el tipo sin parámetros.
            {
              type: 'file',
              mediaType: (file.type || 'audio/webm').split(';')[0]!,
              data: new Uint8Array(await file.arrayBuffer()),
            },
            { type: 'text', text: 'Transcribe y lee esta nota de voz.' },
          ],
        },
      ],
    });
    capture = output;
    await recordAiRun(supabase, {
      task: 'voice_transcription',
      model: answeredBy('audio', response.modelId),
      status: 'ok',
      startedAt,
      usage,
    });
  } catch (error) {
    await recordAiRun(supabase, {
      task: 'voice_transcription',
      model: MODEL_CHAIN.audio[0],
      status: 'error',
      startedAt,
      errorCode: errorCode(error),
    });
    await dropAudio();
    return { ok: false, message: aiFailure(error, AI_MESSAGE.voiceFailed) };
  }

  const transcript = capture.transcript.trim().slice(0, 20_000);
  if (!transcript) {
    await dropAudio();
    return { ok: false, message: 'No se ha oído nada. Prueba otra vez, más cerca del micrófono.' };
  }

  // Una orden de registro fuera de BRAIN: el mismo camino que el texto.
  const command = capture.command?.trim();
  if (slug !== 'brain' && command) {
    const result = interpret(slug, command);
    await dropAudio();
    if (!result.ok) {
      return {
        ok: false,
        message: 'No he entendido la orden. Te dejo lo dicho en la barra para corregirlo.',
        prefill: command,
      };
    }
    const voiceMeta: AiMetaInput = { source: 'voice', path: null, confidence: null };
    const storesSource = result.draft.kind === 'transaction' || result.draft.kind === 'meal';
    return build(result.draft, {
      origin: 'Voz',
      confidence: null,
      warnings: [],
      heard: transcript.slice(0, 300),
      meta: storesSource ? JSON.stringify(voiceMeta) : null,
      upload: null,
      followUps: [],
    });
  }

  // Fuera de BRAIN y HOME, lo que no es una orden no se convierte en nota sin preguntar: vuelve a la barra.
  if (slug !== 'brain' && slug !== 'home') {
    await dropAudio();
    return {
      ok: false,
      message: 'No he reconocido una orden de registro. Te dejo lo dicho en la barra.',
      prefill: transcript.slice(0, 500),
    };
  }

  const mood = capture.mood == null ? '' : String(Math.min(5, Math.max(1, Math.round(capture.mood))));
  const noteMeta: AiMetaInput = { source: 'voice', path, confidence: null, durationS: Math.round(durationS) };
  return build(
    {
      kind: 'note',
      values: {
        content: transcript,
        title: capture.title?.trim().slice(0, 160) ?? '',
        mood,
        tags: normalizeTags(capture.tags).join(', '),
      },
    },
    {
      origin: 'Voz',
      confidence: null,
      warnings: [],
      heard: null,
      meta: JSON.stringify(noteMeta),
      upload: { bucket: 'voice-notes', path },
      followUps: capture.detectedActions
        .filter((action) => action.command.trim())
        .slice(0, 3)
        .map((action) => ({ summary: action.summary.slice(0, 140), command: action.command.trim().slice(0, 200) })),
    },
  );
}

/** Borra el archivo de un borrador descartado: ni la foto ni el audio se quedan sin dueño en Storage. */
export async function discardUpload(bucket: string, path: string): Promise<void> {
  if (!BUCKETS.includes(bucket as UploadBucket) || !STORAGE_PATH.test(path)) return;
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId || !path.startsWith(`${userId}/`)) return;
  await supabase.storage.from(bucket).remove([path]);
}
