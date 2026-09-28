import type { Briefing } from '@/lib/ai/schemas/briefing';
import type { Metrics } from './signals';

const PLACEHOLDER = /\{\{([a-z0-9_.]+)\}\}/g;
const NUMBER_WORDS =
  /\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta|cincuenta|cien|mil|mitad|doble|triple)\b/i;
// El marcador ya se pinta con su unidad («45 min», «12,40 €»): repetirla detrás se lee «45 min minutos».
const UNIT_AFTER_PLACEHOLDER =
  /\}\}\s*(?:minutos?|min|euros?|€|kcal|calor[ií]as|d[ií]as?|gramos?|g|%|por ciento)(?!\p{L})/iu;
const OPEN_ROUTES = new Set(['/home', '/gym', '/vault', '/brain', '/nutrition', '/media', '/routine', '/settings']);

/**
 * Paso 4 · Validar. Un hallazgo que escribe una cifra a mano, usa un marcador inexistente o apunta a una
 * ruta desconocida se descarta. Si no quedan 3 válidos, el briefing entero se rechaza.
 */
export function validateBriefing(
  briefing: Briefing,
  metrics: Metrics,
): { briefing: Briefing | null; problems: string[] } {
  const problems: string[] = [];

  const check = (text: string, where: string) => {
    const before = problems.length;
    for (const [, key] of text.matchAll(PLACEHOLDER)) {
      if (!(key! in metrics)) problems.push(`${where}: marcador desconocido {{${key}}}`);
    }
    const bare = text.replace(PLACEHOLDER, '');
    if (/\d/.test(bare) || NUMBER_WORDS.test(bare)) problems.push(`${where}: cifra escrita a mano`);
    if (UNIT_AFTER_PLACEHOLDER.test(text)) problems.push(`${where}: unidad repetida detrás de un marcador`);
    return problems.length === before;
  };

  check(briefing.headline, 'titular');
  const seen = new Set<string>();
  const insights = briefing.insights.filter((insight) => {
    const textOk = check(insight.text, insight.id);
    const labelOk = check(insight.action.label, `${insight.id}.acción`);
    const routeOk = insight.action.kind !== 'open' || OPEN_ROUTES.has(insight.action.payload);
    if (!routeOk) problems.push(`${insight.id}: ruta desconocida ${insight.action.payload}`);
    const unique = !seen.has(insight.id);
    if (!unique) problems.push(`${insight.id}: identificador repetido`);
    seen.add(insight.id);
    return textOk && labelOk && routeOk && unique;
  });
  if (briefing.reflection && !check(briefing.reflection, 'reflexión')) briefing = { ...briefing, reflection: null };

  const headlineOk = !problems.some((problem) => problem.startsWith('titular'));
  if (!headlineOk || insights.length < 3) return { briefing: null, problems };
  return { briefing: { ...briefing, insights: insights.slice(0, 5) }, problems };
}
