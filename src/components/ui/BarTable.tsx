// Gráfico de barras que ES una tabla (DESIGN_SYSTEM §7): la semántica de tabla da a los lectores de pantalla
// los mismos datos que ve quien mira las barras, sin un «VER TABLA» aparte. Un solo color (blanco),
// ordenado por valor si la categoría es nominal; el periodo actual, en naranja y dicho en el texto («(hoy)»).
// Las filas son rejillas: con display distinto del de tabla, algunos navegadores tiran la semántica de tabla, así
// que cada parte lleva su rol explícito.

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
  /** Lo que es la fila `current`, junto a su etiqueta: «hoy», «última»… */
  currentLabel?: string;
};

export function BarTable({
  caption,
  labelHeader,
  valueHeader,
  rows,
  max,
  reference,
  currentLabel = 'hoy',
}: BarTableProps) {
  const scale = Math.max(max ?? 0, reference?.value ?? 0, ...rows.map((row) => row.value), 1);
  const pct = (value: number) => `${Math.max(0, Math.min(100, (value / scale) * 100))}%`;

  return (
    <table role="table" className="w-full border-collapse text-small">
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup" className="sr-only">
        <tr role="row">
          <th scope="col" role="columnheader">
            {labelHeader}
          </th>
          <th scope="col" role="columnheader">
            {valueHeader}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((row) => (
          <tr
            key={row.key}
            role="row"
            className="grid grid-cols-[minmax(6rem,9rem)_1fr] items-center gap-3 py-1.5 @md:grid-cols-[minmax(8rem,11rem)_1fr]"
          >
            <th scope="row" role="rowheader" className="flex min-w-0 gap-1 text-left font-normal text-ash">
              <span className="truncate">{row.label}</span>
              {row.current ? <span className="shrink-0">({currentLabel})</span> : null}
            </th>
            <td role="cell" className="flex items-center gap-3">
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
        <tfoot role="rowgroup">
          <tr role="row">
            <td role="cell" colSpan={2} className="pt-2 font-mono text-micro text-ash uppercase">
              <span aria-hidden="true" className="mr-2 inline-block h-3 w-0.5 translate-y-0.5 bg-ash" />
              {reference.label}
            </td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}
