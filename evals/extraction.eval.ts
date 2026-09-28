// Línea base del eval de extracción (PROPOSAL §5, Fase 3). Llama a cada modelo gratuito por separado,
// sin cadena ni reserva, con los mismos prompts y esquemas que la app, y compara con la verdad de referencia.
// Uso: npm run eval (EVAL_MODELS=gemini-3.8-flash,gemini-3.5-flash-lite para elegir modelos).
// Cada fixture es una petición por modelo: con unas 20 peticiones diarias por modelo, elige pocos.
import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { MEAL_SYSTEM, RECEIPT_SYSTEM, voiceSystem } from '@/lib/ai/prompts';
import { MealExtractionSchema } from '@/lib/ai/schemas/meal';
import { TicketExtractionSchema, type TicketExtraction } from '@/lib/ai/schemas/ticket';
import { VoiceCaptureSchema } from '@/lib/ai/schemas/voice';
import { validateMeal } from '@/modules/nutrition/meal-rules';
import { interpret } from '@/modules/quick/parse';

const FIXTURES = 'evals/fixtures';
const MODELS = (process.env.EVAL_MODELS ?? 'gemini-3.8-flash')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const thinking = { google: { thinkingConfig: { thinkingLevel: 'low' as const } } };

type Row = { model: string; kind: string; fixture: string; ok: boolean; score: number; ms: number; detail: string };
const rows: Row[] = [];

/** Un 503 es saturación de Google, no un fallo del modelo: se reintenta dos veces con 20 s de espera. */
async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; ms: number; error: string | null }> {
  for (let attempt = 0; ; attempt++) {
    const started = performance.now();
    try {
      return { value: await fn(), ms: Math.round(performance.now() - started), error: null };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 503 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 20_000));
        continue;
      }
      return {
        value: null,
        ms: Math.round(performance.now() - started),
        error: status ? `http_${status}` : String(error),
      };
    }
  }
}

const near = (a: number | null | undefined, b: number, tolerance = 0.011) => a != null && Math.abs(a - b) <= tolerance;

/** Campos del ticket que importan al guardar: total, fecha, comercio, categoría, pago e IVA. */
function scoreTicket(out: TicketExtraction, truth: TicketExtraction) {
  const checks: [string, boolean][] = [
    ['total', near(out.total, truth.total)],
    ['fecha', out.issuedAt === truth.issuedAt],
    ['comercio', (out.merchant ?? '').toUpperCase().includes(truth.merchant!.split(' ')[0]!)],
    ['categoría', out.category === truth.category],
    ['pago', out.paymentMethod === truth.paymentMethod],
    [
      'iva',
      out.vat.length === truth.vat.length &&
        truth.vat.every((line) => out.vat.some((got) => got.ratePct === line.ratePct && near(got.amount, line.amount))),
    ],
  ];
  const failed = checks.filter(([, pass]) => !pass).map(([name]) => name);
  return {
    score: (checks.length - failed.length) / checks.length,
    detail: failed.length ? `falla: ${failed.join(', ')}` : 'todo bien',
  };
}

/** Tasa de error de palabras (WER) de la transcripción: distancia de edición por palabras. */
function wordErrorRate(reference: string, hypothesis: string) {
  const words = (text: string) =>
    text
      .toLocaleLowerCase('es')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const ref = words(reference);
  const hyp = words(hypothesis);
  let previous = Array.from({ length: hyp.length + 1 }, (_, j) => j);
  for (let i = 1; i <= ref.length; i++) {
    const current = [i];
    for (let j = 1; j <= hyp.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (ref[i - 1] === hyp[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[hyp.length]! / Math.max(1, ref.length);
}

const file = (path: string, mediaType: string) => ({
  type: 'file' as const,
  mediaType,
  data: new Uint8Array(readFileSync(path)),
});

it('línea base de extracción', async () => {
  expect(process.env.GOOGLE_GENERATIVE_AI_API_KEY, 'Falta GOOGLE_GENERATIVE_AI_API_KEY en .env.local').toBeTruthy();

  for (const model of MODELS) {
    for (const name of readdirSync(`${FIXTURES}/tickets`).filter((entry) => entry.endsWith('.png'))) {
      const truth = JSON.parse(
        readFileSync(`${FIXTURES}/tickets/${name.replace('.png', '.json')}`, 'utf8'),
      ) as TicketExtraction;
      const run = await timed(() =>
        generateText({
          model: google(model),
          maxRetries: 0,
          system: RECEIPT_SYSTEM,
          output: Output.object({ schema: TicketExtractionSchema, name: 'ticket' }),
          providerOptions: thinking,
          messages: [
            {
              role: 'user',
              content: [
                file(`${FIXTURES}/tickets/${name}`, 'image/png'),
                { type: 'text', text: 'Extrae los datos de este ticket.' },
              ],
            },
          ],
        }),
      );
      const scored = run.value ? scoreTicket(run.value.output, truth) : { score: 0, detail: run.error ?? 'sin salida' };
      rows.push({ model, kind: 'ticket', fixture: name, ok: Boolean(run.value), ms: run.ms, ...scored });
    }

    for (const name of readdirSync(`${FIXTURES}/meals`).filter((entry) => entry.endsWith('.jpg'))) {
      const run = await timed(() =>
        generateText({
          model: google(model),
          maxRetries: 0,
          system: MEAL_SYSTEM,
          output: Output.object({ schema: MealExtractionSchema, name: 'plato' }),
          providerOptions: thinking,
          messages: [
            {
              role: 'user',
              content: [
                file(`${FIXTURES}/meals/${name}`, 'image/jpeg'),
                { type: 'text', text: 'Estima el contenido nutricional de este plato.' },
              ],
            },
          ],
        }),
      );
      // Sin verdad de referencia para los macros: se mide la coherencia (Atwater) y que haya alimentos.
      const meal = run.value ? validateMeal(run.value.output, 'x/y.jpg') : null;
      const coherent =
        meal !== null &&
        meal.totals.caloriesKcal > 0 &&
        !meal.warnings.some((warning) => warning.includes('no cuadran'));
      rows.push({
        model,
        kind: 'plato',
        fixture: name,
        ok: Boolean(run.value),
        ms: run.ms,
        score: coherent ? 1 : 0,
        detail: meal ? `${meal.totals.caloriesKcal} kcal · ${meal.description}` : (run.error ?? 'sin salida'),
      });
    }

    if (/lite/.test(model)) continue; // Los Flash-Lite no aceptan audio.
    for (const name of readdirSync(`${FIXTURES}/voice`).filter((entry) => entry.endsWith('.wav'))) {
      const reference = readFileSync(`${FIXTURES}/voice/${name.replace('.wav', '.txt')}`, 'utf8').trim();
      const tab = name.startsWith('gym') ? 'gym' : name.startsWith('rutina') ? 'routine' : 'brain';
      const run = await timed(() =>
        generateText({
          model: google(model),
          maxRetries: 0,
          system: voiceSystem(tab.toUpperCase()),
          output: Output.object({ schema: VoiceCaptureSchema, name: 'nota_de_voz' }),
          providerOptions: thinking,
          messages: [
            {
              role: 'user',
              content: [
                file(`${FIXTURES}/voice/${name}`, 'audio/wav'),
                { type: 'text', text: 'Transcribe y lee esta nota de voz.' },
              ],
            },
          ],
        }),
      );
      if (!run.value) {
        rows.push({
          model,
          kind: 'voz',
          fixture: name,
          ok: false,
          ms: run.ms,
          score: 0,
          detail: run.error ?? 'sin salida',
        });
        continue;
      }
      const wer = wordErrorRate(reference, run.value.output.transcript);
      // En GYM y ROUTINE la orden tiene que convertirse en el mismo borrador que el texto.
      const command = run.value.output.command;
      const understood = tab === 'brain' || Boolean(command && interpret(tab, command).ok);
      rows.push({
        model,
        kind: 'voz',
        fixture: name,
        ok: true,
        ms: run.ms,
        score: understood ? 1 - Math.min(1, wer) : 0,
        detail: `WER ${(wer * 100).toFixed(0)} %${tab === 'brain' ? '' : ` · orden «${command ?? '—'}» ${understood ? 'entendida' : 'NO entendida'}`}`,
      });
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  mkdirSync('evals/results', { recursive: true });
  writeFileSync(`evals/results/${date}.json`, JSON.stringify({ date, models: MODELS, rows }, null, 2) + '\n');
  console.table(
    rows.map(({ model, kind, fixture, ok, score, ms, detail }) => ({
      model,
      kind,
      fixture,
      ok,
      score: score.toFixed(2),
      ms,
      detail,
    })),
  );
  expect(rows.length).toBeGreaterThan(0);
});
