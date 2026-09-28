import type { AiMetaInput } from '@/lib/ai/draft-meta';
import type { TicketExtraction } from '@/lib/ai/schemas/ticket';

export type ReceiptDraft = {
  merchant: string | null;
  /** Hora local del ticket (YYYY-MM-DDTHH:mm), o null si no se lee: entonces el borrador usa «ahora». */
  issuedAtLocal: string | null;
  amount: number;
  category: TicketExtraction['category'];
  paymentMethod: TicketExtraction['paymentMethod'];
  confidence: number;
  warnings: string[];
  meta: AiMetaInput;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value);
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Reglas de dominio sobre la salida del modelo: no rechazan, avisan. Quien confirma decide.
 * `nowLocal` es la hora local del perfil ('YYYY-MM-DDTHH:mm'), para detectar fechas futuras sin
 * depender de la zona del servidor.
 */
export function validateReceipt(
  extraction: TicketExtraction,
  receiptPath: string,
  { nowLocal, currency }: { nowLocal: string; currency: string },
): ReceiptDraft {
  const warnings = [...extraction.warnings];
  const total = round2(extraction.total);
  const vat = extraction.vat.map((line) => ({
    ratePct: line.ratePct,
    base: round2(line.base),
    amount: round2(line.amount),
  }));
  const vatGross = round2(vat.reduce((sum, line) => sum + line.base + line.amount, 0));

  if (!(total > 0)) warnings.push('No se ha podido leer un total válido.');
  if (vat.length > 0 && Math.abs(vatGross - total) > 0.02) {
    warnings.push(`El desglose de IVA no cuadra con el total por ${money(Math.abs(vatGross - total), currency)}.`);
  }

  const ticketCurrency = extraction.currency.toUpperCase();
  if (/^[A-Z]{3}$/.test(ticketCurrency) && ticketCurrency !== currency) {
    warnings.push(`El ticket está en ${ticketCurrency} y se guardará en ${currency}: revisa el importe.`);
  }

  let issuedAtLocal = extraction.issuedAt;
  if (issuedAtLocal && !LOCAL_DATETIME.test(issuedAtLocal)) {
    warnings.push('La fecha del ticket no tiene un formato válido: se usa la de ahora.');
    issuedAtLocal = null;
  } else if (issuedAtLocal && issuedAtLocal.slice(0, 10) > nowLocal.slice(0, 10)) {
    warnings.push('La fecha del ticket está en el futuro: se usa la de ahora.');
    issuedAtLocal = null;
  }

  const confidence = Math.min(1, Math.max(0, extraction.confidence));
  return {
    merchant: extraction.merchant?.trim() || null,
    issuedAtLocal,
    amount: total,
    category: extraction.category,
    paymentMethod: extraction.paymentMethod,
    confidence,
    warnings,
    meta: {
      source: 'ocr',
      path: receiptPath,
      confidence,
      taxAmount: vat.length > 0 ? round2(vat.reduce((sum, line) => sum + line.amount, 0)) : null,
      taxBreakdown: vat.length > 0 ? vat.slice(0, 10) : null,
      raw: extraction,
    },
  };
}
