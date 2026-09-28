'use server';

import { TABS } from '@/config/tabs';
import { draftContext } from './context';
import { interpret } from './parse';
import type { DraftResult } from './types';

export type { DraftContext, InterpretedDraft } from './types';

/**
 * Convierte el texto de la barra en un borrador. No escribe nada: guardar es otra acción, la del
 * módulo, y solo ocurre cuando la persona confirma el borrador.
 */
export async function interpretQuickText(tab: string, text: string): Promise<DraftResult> {
  const slug = TABS.find((entry) => entry.slug === tab)?.slug ?? 'home';
  const result = interpret(slug, text.slice(0, 2000));
  if (!result.ok) return result;
  return { ok: true, draft: { ...result.draft, context: await draftContext(result.draft) } };
}
