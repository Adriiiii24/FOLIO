import 'server-only';
import { google, type GoogleLanguageModelOptions } from '@ai-sdk/google';
import { APICallError, RetryError, wrapLanguageModel, type LanguageModel } from 'ai';
import { addDays, localDate, zonedToUtcIso } from '@/lib/dates';

/**
 * Todos los modelos en un único sitio. Requisito del autor: IA gratuita, así que todo va al nivel gratuito
 * de la Gemini API (una sola clave, GOOGLE_GENERATIVE_AI_API_KEY).
 *
 * El nivel gratuito limita peticiones POR MODELO y por día, compartidas por todo el proyecto (comprobado el
 * 2026-09-28: gemini-3.8-flash admite 20 al día). Por eso cada ruta es una cadena: el primero es el de más
 * calidad y los demás suman su propia cuota. El orden definitivo sale del eval (PROPOSAL §8).
 */
export const MODEL_CHAIN = {
  vision: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ],
  structuring: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ],
  // Los Flash-Lite no aceptan audio: la voz solo usa Flash.
  audio: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'],
  chat: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ],
  briefing: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ],
} as const;

export type ModelRoute = keyof typeof MODEL_CHAIN;

export const EMBEDDING_MODEL = 'gemini-embedding-2';
/** Igual que la columna notes.embedding (vector(1536)). gemini-embedding-2 renormaliza al recortar. */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Razonamiento por ruta: la primera palanca de latencia y de cuota (los tokens de razonamiento cuentan
 * en el límite por minuto). Ojo: gemini-3.8-flash rechaza 'minimal' con un 400 (comprobado el 2026-09-28);
 * 'low' es el mínimo común de toda la cadena.
 */
const THINKING: Record<ModelRoute, 'low' | 'medium' | 'high'> = {
  vision: 'low',
  structuring: 'low',
  audio: 'low',
  chat: 'low',
  briefing: 'medium',
};

export function providerOptions(route: ModelRoute) {
  return { google: { thinkingConfig: { thinkingLevel: THINKING[route] } } satisfies GoogleLanguageModelOptions };
}

/** Ningún modelo de la cadena puede responder ahora. `daily`: todos han agotado su cuota de hoy. */
export class AiUnavailableError extends Error {
  constructor(readonly reason: 'daily' | 'busy') {
    super(reason === 'daily' ? 'Cuota diaria gratuita agotada en todos los modelos' : 'Modelos saturados');
    this.name = 'AiUnavailableError';
  }
}

const unwrap = (error: unknown) => (RetryError.isInstance(error) ? error.lastError : error);

/** 429 y 5xx: el nivel gratuito se satura a ratos y tiene cuota diaria. Un 400 no mejora cambiando de modelo. */
export function isOverloaded(error: unknown): boolean {
  const cause = unwrap(error);
  if (cause instanceof AiUnavailableError) return true;
  return APICallError.isInstance(cause) && (cause.statusCode === 429 || (cause.statusCode ?? 0) >= 500);
}

export function isDailyQuota(error: unknown): boolean {
  const cause = unwrap(error);
  return cause instanceof AiUnavailableError && cause.reason === 'daily';
}

/** Google reinicia las cuotas diarias a medianoche de la hora del Pacífico. */
function nextPacificMidnight(): number {
  const zone = 'America/Los_Angeles';
  return new Date(zonedToUtcIso(`${addDays(localDate(zone), 1)}T00:00`, zone)).getTime();
}

type Rest = { until: number; daily: boolean };

/**
 * Modelos en reposo, en la memoria del proceso: uno sin cuota no se vuelve a probar hasta el reinicio y uno
 * saturado descansa 30 s. Así una petición no paga segundos de espera por modelos que van a fallar.
 */
const resting = new Map<string, Rest>();

function restFor(error: unknown): Rest | null {
  if (!APICallError.isInstance(error)) return null;
  if (error.statusCode === 429) {
    const body = error.responseBody ?? '';
    if (/PerDay/.test(body)) return { until: nextPacificMidnight(), daily: true };
    const seconds = Number(/"retryDelay":\s*"(\d+)/.exec(body)?.[1] ?? 60);
    return { until: Date.now() + seconds * 1000, daily: false };
  }
  if ((error.statusCode ?? 0) >= 500) return { until: Date.now() + 30_000, daily: false };
  return null;
}

/**
 * Prueba la cadena en orden, saltando los modelos en reposo. Un error que no es de cuota ni de saturación
 * (un 400, una imagen ilegible) se lanza tal cual: otro modelo no lo arreglaría.
 */
async function throughChain<T>(chain: readonly string[], call: (modelId: string) => PromiseLike<T>): Promise<T> {
  const now = Date.now();
  for (const id of chain.filter((model) => (resting.get(model)?.until ?? 0) <= now)) {
    try {
      const result = await call(id);
      resting.delete(id);
      return result;
    } catch (error) {
      const rest = restFor(error);
      if (!rest) throw error;
      resting.set(id, rest);
      // Solo el modelo, el estado y la cuota: nunca el contenido de la petición.
      const quota = APICallError.isInstance(error) ? /"quotaId":\s*"([^"]+)"/.exec(error.responseBody ?? '')?.[1] : '';
      console.warn(`[ia] ${id} en reposo: ${APICallError.isInstance(error) ? error.statusCode : '?'} ${quota ?? ''}`);
    }
  }
  throw new AiUnavailableError(chain.every((id) => resting.get(id)?.daily) ? 'daily' : 'busy');
}

/**
 * El envoltorio se identifica como el primero de la cadena; los metadatos de respuesta se reescriben con
 * el modelo que respondió de verdad, para que ai_runs y el eval sepan quién contestó.
 */
function chainModel(chain: readonly [string, ...string[]]): LanguageModel {
  return wrapLanguageModel({
    model: google(chain[0]),
    middleware: {
      wrapGenerate: ({ params }) =>
        throughChain(chain, async (id) => {
          const result = await google(id).doGenerate(params);
          return { ...result, response: { ...result.response, modelId: id } };
        }),
      wrapStream: ({ params }) =>
        throughChain(chain, async (id) => {
          const result = await google(id).doStream(params);
          const stream = result.stream.pipeThrough(
            new TransformStream({
              transform(part, controller) {
                controller.enqueue(part.type === 'response-metadata' ? { ...part, modelId: id } : part);
              },
            }),
          );
          return { ...result, stream };
        }),
    },
  });
}

export const models = {
  vision: chainModel(MODEL_CHAIN.vision),
  structuring: chainModel(MODEL_CHAIN.structuring),
  audio: chainModel(MODEL_CHAIN.audio),
  chat: chainModel(MODEL_CHAIN.chat),
  briefing: chainModel(MODEL_CHAIN.briefing),
  embedding: google.embedding(EMBEDDING_MODEL),
};

export const embeddingOptions = { google: { outputDimensionality: EMBEDDING_DIMENSIONS } };

/** gemini-embedding-2 no usa taskType: la tarea va en el propio texto (documentación de Google). */
export const asQuery = (text: string) => `task: search result | query: ${text}`;
export const asDocument = ({ title, content }: { title: string | null; content: string }) =>
  `title: ${title?.trim() || 'none'} | text: ${content}`;
