// scripts/build-foods-migration.mts · node scripts/build-foods-migration.mts
// Genera la migración que carga `public.foods` desde supabase/data/ciqual-2025-es.csv (ver su README).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const source = join(root, 'supabase/data/ciqual-2025-es.csv');
const target = join(root, 'supabase/migrations/20260929000001_foods_data.sql');

const COLUMNS = [
  'ciqual_code',
  'name',
  'category',
  'kcal',
  'protein_g',
  'carbs_g',
  'fat_g',
  'aliases',
  'name_en',
] as const;

/** CSV RFC 4180: campos entre comillas si llevan comas o comillas, y "" como comilla escapada. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

function sqlNumber(value: string, line: number): string {
  if (!/^\d+(\.\d+)?$/.test(value)) throw new Error(`Línea ${line}: «${value}» no es un número válido`);
  return value;
}

const [header, ...rows] = parseCsv(readFileSync(source, 'utf8'));
if (header?.join(',') !== COLUMNS.join(',')) throw new Error(`Cabecera inesperada: ${header?.join(',')}`);

const values = rows.map((cells, index) => {
  const line = index + 2;
  if (cells.length !== COLUMNS.length) throw new Error(`Línea ${line}: ${cells.length} columnas`);
  const [code = '', name = '', category = '', kcal = '', protein = '', carbs = '', fat = '', aliases = ''] = cells;
  if (!/^\d+$/.test(code)) throw new Error(`Línea ${line}: código «${code}»`);
  const numbers = [kcal, protein, carbs, fat].map((value) => sqlNumber(value, line));
  return `  (${[code, sqlText(name), sqlText(category), ...numbers, sqlText(aliases)].join(', ')})`;
});

const sql = `-- =============================================================================
-- FOLIO · datos del catálogo de alimentos
-- supabase/migrations/20260929000001_foods_data.sql
-- GENERADO por scripts/build-foods-migration.mts desde supabase/data/ciqual-2025-es.csv.
-- No se edita a mano: para corregir datos ya aplicados, una migración nueva con «update».
--
-- Fuente: Anses. 2025. Table de composition nutritionnelle des aliments Ciqual (versión
-- del 2025-11-03). Licence Ouverte / Open Licence 2.0 (Etalab). Nombres traducidos al
-- español y alimentos filtrados para FOLIO: ver supabase/data/README.md.
-- =============================================================================

insert into public.foods (id, name, category, kcal, protein_g, carbs_g, fat_g, aliases) values
${values.join(',\n')};
`;

writeFileSync(target, sql);
console.log(`${values.length} alimentos → ${target}`);
