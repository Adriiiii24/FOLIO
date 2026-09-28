// Gráfico de barras que ES una tabla (DESIGN_SYSTEM §7): la semántica de tabla da a los lectores de pantalla
// los mismos datos que ve quien mira las barras, sin un «VER TABLA» aparte. Un solo color (blanco),
// ordenado por valor si la categoría es nominal; el periodo actual, en naranja.

export type BarRow = { key: string; label: string; value: number; formatted: string; current?: boolean };

type BarTableProps = {
  caption: string;
  labelHeader: string;
  valueHeader: string;
  rows: readonly BarRow[];
  /** Máximo de la escala; por defecto, el mayor valor. */
  max?: number;
  /** Marca vertical de referencia (p. ej. el objetivo diario), en unidades de `value`. */
  reference?: { value: number; label: string };
};

export function BarTable({ caption, labelHeader, valueHeader, rows, max, reference }: BarTableProps) {
  const scale = Math.max(max ?? 0, reference?.value ?? 0, ...rows.map((row) => row.value), 1);
  const pct = (value: number) => `${Math.max(0, Math.min(100, (value / scale) * 100))}%`;

  return (
    <table className="w-full border-collapse text-small">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{labelHeader}</th>
          <th scope="col">{valueHeader}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            className="grid grid-cols-[minmax(6rem,9rem)_1fr] items-center gap-3 py-1.5 @md:grid-cols-[minmax(8rem,11rem)_1fr]"
          >
            <th scope="row" className="truncate text-left font-normal text-ash">
              {row.label}
            </th>
            <td className="flex items-center gap-3">
              <span className="relative block h-5 flex-1">
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 block ${row.current ? 'bg-brand-orange' : 'bg-white'}`}
                  style={{ width: pct(row.value) }}
                />
                {reference ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-[-3px] block w-0.5 bg-ash"
                    style={{ left: pct(reference.value) }}
                  />
                ) : null}
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-label">{row.formatted}</span>
            </td>
          </tr>
        ))}
      </tbody>
      {reference ? (
        <tfoot>
          <tr>
            <td colSpan={2} className="pt-2 font-mono text-micro text-ash uppercase">
              <span aria-hidden="true" className="mr-2 inline-block h-3 w-0.5 translate-y-0.5 bg-ash" />
              {reference.label}
            </td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}
