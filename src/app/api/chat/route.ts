import { convertToModelMessages, isStepCount, streamText, type UIMessage } from 'ai';
import { AI_MESSAGE, aiFailure } from '@/lib/ai/guard';
import { MODEL_CHAIN, models, providerOptions } from '@/lib/ai/models';
import { chatSystem } from '@/lib/ai/prompts';
import { getAiQuota } from '@/lib/ai/quota';
import { errorCode, recordAiRun } from '@/lib/ai/telemetry';
import { buildTools } from '@/lib/ai/tools';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';

export const maxDuration = 60;

const MAX_MESSAGES = 40;
const MAX_QUESTION_CHARS = 2000;

const textOf = (message: UIMessage) =>
  message.parts.reduce((text, part) => (part.type === 'text' ? text + part.text : text), '');

/** Una pregunta = un uso de IA, aunque el modelo encadene varias herramientas para responderla. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return Response.json({ error: AI_MESSAGE.unauthorized }, { status: 401 });

  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }
  const last = messages?.at(-1);
  if (
    !Array.isArray(messages) ||
    messages.length > MAX_MESSAGES ||
    last?.role !== 'user' ||
    textOf(last).length > MAX_QUESTION_CHARS
  ) {
    return Response.json({ error: 'La conversación es demasiado larga. Ciérrala y empieza otra.' }, { status: 400 });
  }

  const profile = await getProfile();
  const quota = await getAiQuota(supabase, userId, profile.timezone);
  if (quota.exceeded) return Response.json({ error: AI_MESSAGE.quota(quota.limit) }, { status: 429 });

  const startedAt = performance.now();
  const result = streamText({
    model: models.chat,
    system: chatSystem({ now: new Date(), timeZone: profile.timezone }),
    messages: await convertToModelMessages(messages),
    tools: buildTools(supabase, { timeZone: profile.timezone }),
    stopWhen: isStepCount(5),
    providerOptions: providerOptions('chat'),
    onEnd: async ({ totalUsage, response }) => {
      await recordAiRun(supabase, {
        task: 'chat',
        model: response.modelId || MODEL_CHAIN.chat[0],
        status: 'ok',
        startedAt,
        usage: totalUsage,
      });
    },
    onError: async ({ error }) => {
      await recordAiRun(supabase, {
        task: 'chat',
        model: MODEL_CHAIN.chat[0],
        status: 'error',
        startedAt,
        errorCode: errorCode(error),
      });
    },
  });

  // El error que ve la persona: qué ha pasado y qué hacer, nunca el mensaje técnico del proveedor.
  return result.toUIMessageStreamResponse({
    onError: (error) => aiFailure(error, 'No se ha podido responder. Prueba otra vez en un momento.'),
  });
}
