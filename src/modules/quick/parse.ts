// Intérprete determinista de la barra de entrada (Fase 2, sin IA). Convierte una frase en un BORRADOR
// que la persona revisa y confirma: nunca escribe nada por su cuenta. La pestaña activa es el contexto
// (PROPOSAL §2.2): en VAULT se busca un importe; en ROUTINE, un hábito; en HOME se prueba todo en orden.

import type { TabSlug } from '@/config/tabs';
import type { TRANSACTION_CATEGORIES } from '@/lib/ai/schemas/ticket';

type Category = (typeof TRANSACTION_CATEGORIES)[number];
type MediaKind = 'book' | 'film' | 'series' | 'podcast' | 'game' | 'album';
type MediaStatus = 'backlog' | 'in_progress' | 'done' | 'dropped';

// Los campos opcionales solo los rellenan los borradores de IA (foto y voz, Fase 3); el texto no los usa.
export type QuickDraft =
  | {
      kind: 'transaction';
      values: {
        kind: 'expense' | 'income';
        amount: string;
        merchant: string;
        category: Category;
        paymentMethod?: string;
        occurredAt?: string;
      };
    }
  | { kind: 'sets'; values: { exercise: string; count: number; reps: number; weightKg: string } }
  | { kind: 'habit'; values: { habitName: string } }
  | { kind: 'media'; values: { kind: MediaKind; status: MediaStatus; title: string; rating: string } }
  | {
      kind: 'meal';
      values: {
        description: string;
        mealType?: string;
        caloriesKcal?: string;
        proteinG?: string;
        carbsG?: string;
        fatG?: string;
      };
    }
  | { kind: 'note'; values: { content: string; title?: string; mood?: string; tags?: string } };

export type ParseResult = { ok: true; draft: QuickDraft } | { ok: false; message: string };

const plain = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');
const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
const clean = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[,:;\-–—]+|[,:;\-–—]+$/g, '')
    .trim();

// ── Dinero ──────────────────────────────────────────────────────────────────

const AMOUNT = String.raw`(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)`;
const CURRENCY = String.raw`(?:\s*(?:€|eur(?:os)?))?`;

/** «1.200,50» → «1200,50»; «12.40» → «12,40»; «1.200» → «1200» (punto de miles). */
export function normalizeAmount(raw: string): string {
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)) return raw.replace(/\./g, '');
  return raw.replace('.', ',');
}

const CATEGORY_KEYWORDS: [Category, RegExp][] = [
  ['salary', /\b(nomina|salario|sueldo)\b/],
  [
    'groceries',
    /\b(mercadona|carrefour|lidl|aldi|dia|alcampo|eroski|consum|hipercor|ahorramas|supermercado|super|fruteria|panaderia|carniceria|compra)\b/,
  ],
  [
    'restaurants',
    /\b(restaurante|bar|cafe|cafeteria|burger|mcdonalds?|kfc|telepizza|glovo|just eat|sushi|pizza|taberna|cena|comida|menu|tapas|cervezas?)\b/,
  ],
  [
    'transport',
    /\b(gasolina|gasoil|repsol|cepsa|galp|shell|renfe|metro|bus|emt|uber|cabify|taxi|parking|peaje|bolt|blablacar|tren)\b/,
  ],
  ['travel', /\b(vuelo|ryanair|vueling|iberia|hotel|airbnb|booking|viaje)\b/],
  ['subscriptions', /\b(netflix|spotify|hbo|max|disney|prime|youtube|icloud|suscripcion|chatgpt|claude)\b/],
  ['health', /\b(farmacia|medico|dentista|fisio|fisioterapeuta|clinica|hospital|optica)\b/],
  ['sport', /\b(gimnasio|gym|decathlon|padel|piscina|crossfit|yoga)\b/],
  ['utilities', /\b(luz|agua|gas|endesa|iberdrola|naturgy|movistar|vodafone|orange|digi|internet|fibra|telefono)\b/],
  ['housing', /\b(alquiler|hipoteca|comunidad)\b/],
  ['education', /\b(curso|udemy|matricula|academia|libreria|libros?)\b/],
  ['leisure', /\b(cine|concierto|entradas?|teatro|museo|steam|playstation|nintendo|xbox)\b/],
  ['shopping', /\b(amazon|zara|primark|corte ingles|fnac|mediamarkt|aliexpress|ikea|ropa|zapatillas)\b/],
  ['gifts', /\b(regalo|cumpleanos)\b/],
  ['taxes', /\b(impuesto|hacienda|multa|ibi)\b/],
];

export function guessCategory(text: string): Category {
  const value = plain(text);
  return CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(value))?.[0] ?? 'other';
}

export function parseTransaction(text: string): QuickDraft | null {
  const value = clean(text);
  // «ingreso 50 bizum de Ana»: una palabra clave, el importe y el concepto.
  const keywordFirst = new RegExp(
    `^(ingreso|cobro|gasto|pago|compra)\\s+${AMOUNT}${CURRENCY}\\s+(?:en\\s+|de\\s+)?(.+)$`,
    'i',
  ).exec(value);
  const amountFirst = new RegExp(`^([+-])?\\s*${AMOUNT}${CURRENCY}\\s+(?:en\\s+)?(.+)$`, 'i').exec(value);
  const amountLast = new RegExp(`^(.+?)\\s+([+-])?${AMOUNT}${CURRENCY}$`, 'i').exec(value);
  const [sign, rawAmount, rawMerchant] = keywordFirst
    ? [/^(ingreso|cobro)$/i.test(keywordFirst[1] ?? '') ? '+' : '', keywordFirst[2], keywordFirst[3]]
    : amountFirst
      ? [amountFirst[1], amountFirst[2], amountFirst[3]]
      : amountLast
        ? [amountLast[2], amountLast[3], amountLast[1]]
        : [];
  if (!rawAmount || !rawMerchant) return null;

  const merchant = capitalize(clean(rawMerchant.replace(/^(?:gasto|pago|compra)\s+(?:en\s+|de\s+)?/i, '')));
  const income = sign === '+' || /^(ingreso|cobro|nomina|salario|sueldo)\b/.test(plain(merchant));
  const category = income ? (guessCategory(merchant) === 'salary' ? 'salary' : 'other') : guessCategory(merchant);
  return {
    kind: 'transaction',
    values: {
      kind: income ? 'income' : 'expense',
      amount: normalizeAmount(rawAmount),
      merchant,
      category: category === 'salary' && !income ? 'other' : category,
    },
  };
}

// ── Entreno ─────────────────────────────────────────────────────────────────

const WEIGHT = String.raw`(?:\s*(?:a|con|@|de)?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:kg|kilos)?)?`;

export function parseSets(text: string): QuickDraft | null {
  const value = clean(text).toLocaleLowerCase('es');
  const compact = new RegExp(`^(.+?)[,:]?\\s+(\\d{1,2})\\s*[x×]\\s*(\\d{1,3})${WEIGHT}$`).exec(value);
  const spoken = new RegExp(
    `^(.+?)[,:]?\\s+(\\d{1,2})\\s+series?\\s+de\\s+(\\d{1,3})(?:\\s+(?:repeticiones|reps))?${WEIGHT}$`,
  ).exec(value);
  const match = compact ?? spoken;
  if (!match?.[1] || !match[2] || !match[3]) return null;
  const count = Number(match[2]);
  const reps = Number(match[3]);
  if (count < 1 || count > 20 || reps > 200) return null;
  return {
    kind: 'sets',
    values: {
      exercise: capitalize(clean(match[1])),
      count,
      reps,
      weightKg: match[4] ? match[4].replace('.', ',') : '0',
    },
  };
}

// ── Hábitos ─────────────────────────────────────────────────────────────────

export function parseHabit(text: string): QuickDraft | null {
  const match = /^(?:hecho|hecha|he hecho|done|completado|completada|check)\s*[:\-–]?\s*(.+)$/i.exec(clean(text));
  if (!match?.[1]) return null;
  return { kind: 'habit', values: { habitName: capitalize(clean(match[1])) } };
}

// ── Consumo cultural ────────────────────────────────────────────────────────

const MEDIA_VERBS: [RegExp, MediaStatus, MediaKind | null][] = [
  [/^(?:terminad[oa]|acabad[oa]|termine|acabe)$/, 'done', null],
  [/^(?:visto|vista|vi)$/, 'done', 'film'],
  [/^(?:leido|leida|lei)$/, 'done', 'book'],
  [/^(?:empiezo|empezado|empece|empezando)$/, 'in_progress', null],
  [/^(?:viendo)$/, 'in_progress', 'series'],
  [/^(?:leyendo)$/, 'in_progress', 'book'],
  [/^(?:jugando)$/, 'in_progress', 'game'],
  [/^(?:escuchando)$/, 'in_progress', 'album'],
  [/^(?:pendiente|quiero ver|quiero leer|apuntar)$/, 'backlog', null],
  [/^(?:abandonad[oa]|dejad[oa]|deje)$/, 'dropped', null],
];

const KIND_WORDS: [RegExp, MediaKind][] = [
  [/^(?:el |la )?(?:libro|novela|ensayo)\s+/, 'book'],
  [/^(?:la )?(?:pelicula|peli)\s+/, 'film'],
  [/^(?:la )?serie\s+/, 'series'],
  [/^(?:el )?(?:podcast|podcast)\s+/, 'podcast'],
  [/^(?:el )?(?:juego|videojuego)\s+/, 'game'],
  [/^(?:el )?(?:disco|album)\s+/, 'album'],
];

export function parseMedia(text: string): QuickDraft | null {
  const value = clean(text);
  const match = /^([\p{L} ]+?)\s*[:\-–]\s*(.+)$/u.exec(value) ?? /^(\p{L}+)\s+(.+)$/u.exec(value);
  if (!match?.[1] || !match[2]) return null;
  const verb = MEDIA_VERBS.find(([pattern]) => pattern.test(plain(match[1] ?? '')));
  if (!verb) return null;

  let rest = match[2];
  let rating = '';
  const scored = /^(.+?)[,;]?\s+(\d{1,2})(?:\s*(?:\/|sobre|de)\s*10)?$/i.exec(rest);
  if (scored?.[1] && scored[2] && Number(scored[2]) >= 1 && Number(scored[2]) <= 10) {
    rest = scored[1];
    rating = scored[2];
  }

  let kind: MediaKind = verb[2] ?? 'book';
  for (const [pattern, word] of KIND_WORDS) {
    // El patrón se evalúa sin tildes («la pelicula»); para quitarlo del texto original, con sus tildes,
    // se quitan tantas palabras como ocupa. Quitar tildes no cambia el número de palabras.
    const prefix = pattern.exec(plain(rest));
    if (prefix) {
      kind = word;
      rest = rest.trim().split(/\s+/).slice(prefix[0].trim().split(/\s+/).length).join(' ');
      break;
    }
  }
  const title = clean(rest);
  if (!title) return null;
  return { kind: 'media', values: { kind, status: verb[1], title: capitalize(title), rating } };
}

// ── Despacho por contexto ───────────────────────────────────────────────────

const HINT: Record<TabSlug, string> = {
  home: 'Prueba «12,40 Mercadona», «hecho: meditar» o «sentadilla 5x5 a 100».',
  gym: 'No encuentro series y repeticiones. Prueba «sentadilla 5x5 a 100» o «press banca, 4 series de 8 a 80».',
  vault: 'No encuentro el importe. Prueba «12,40 Mercadona» o «+1.200 nómina».',
  brain: 'Escribe la entrada del diario.',
  nutrition: 'Describe lo que has comido: «200 g de pollo con arroz».',
  media: 'Prueba «terminado: Dune, 9» o «viendo: The Bear».',
  routine: 'Prueba «hecho: meditar».',
  settings: 'Prueba «12,40 Mercadona», «hecho: meditar» o «sentadilla 5x5 a 100».',
};

export function interpret(context: TabSlug, text: string): ParseResult {
  const value = clean(text);
  if (!value) return { ok: false, message: HINT[context] };
  const found = (draft: QuickDraft | null): ParseResult =>
    draft ? { ok: true, draft } : { ok: false, message: HINT[context] };

  switch (context) {
    case 'vault':
      return found(parseTransaction(value));
    case 'gym':
      return found(parseSets(value));
    case 'routine':
      return found(parseHabit(value) ?? { kind: 'habit', values: { habitName: capitalize(value) } });
    case 'media':
      return found(
        parseMedia(value) ?? {
          kind: 'media',
          values: { kind: 'book', status: 'backlog', title: capitalize(value), rating: '' },
        },
      );
    case 'nutrition':
      return found({ kind: 'meal', values: { description: capitalize(value) } });
    case 'brain':
      return found({ kind: 'note', values: { content: value } });
    default:
      // HOME y SETTINGS: los prefijos explícitos primero; lo que no encaja es una nota del diario.
      return found(
        parseHabit(value) ??
          parseMedia(value) ??
          parseSets(value) ??
          parseTransaction(value) ?? { kind: 'note', values: { content: value } },
      );
  }
}
