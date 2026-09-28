import { NextResponse } from 'next/server';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { EXPORT_TABLES, type ExportTable } from '@/modules/settings/export';

// Exportación completa de los datos de la sesión (PROPOSAL §2.3, 08 // SETTINGS). Todo pasa por RLS:
// el cliente es el de la sesión, así que solo salen las filas propias.

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  const first = rows[0];
  if (!first) return '';
  const columns = Object.keys(first).filter((column) => column !== 'embedding' && column !== 'fts');
  return [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join(
    '\r\n',
  );
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = { 'Cache-Control': 'no-store' };

  if (format === 'csv') {
    const table = url.searchParams.get('tabla') as ExportTable | null;
    if (!table || !EXPORT_TABLES.includes(table))
      return NextResponse.json({ error: 'Tabla no válida' }, { status: 400 });
    const { data, error } = await supabase.from(table).select('*');
    if (error) return NextResponse.json({ error: 'No se ha podido exportar' }, { status: 500 });
    // BOM: Excel abre el CSV en UTF-8 y respeta las tildes.
    return new NextResponse(`﻿${toCsv(data as Record<string, unknown>[])}`, {
      headers: {
        ...headers,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="folio-${table}-${stamp}.csv"`,
      },
    });
  }

  const entries = await Promise.all(
    EXPORT_TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw new Error(`${table}: ${error.message}`);
      // Sin el vector ni el índice de texto: no son datos de la persona, son derivados.
      const rows = (data as Record<string, unknown>[]).map((row) =>
        Object.fromEntries(Object.entries(row).filter(([column]) => column !== 'embedding' && column !== 'fts')),
      );
      return [table, rows] as const;
    }),
  );
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), app: 'FOLIO', data: Object.fromEntries(entries) },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="folio-${stamp}.json"`,
    },
  });
}
