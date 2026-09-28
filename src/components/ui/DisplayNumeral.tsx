import type { CSSProperties } from 'react';
import { DeltaChip } from './DeltaChip';
import { RollingNumber } from './RollingNumber';

type DisplayNumeralProps = {
  value: number;
  format?: Intl.NumberFormatOptions;
  /** Nombre accesible, p. ej. «Gasto del mes». */
  label: string;
  /** Texto en mayúsculas de etiqueta bajo la cifra. */
  caption?: string;
  /** Sustituye al número formateado (p. ej. la fecha 27‘09). */
  display?: string;
  /** Versión legible de `display` para lectores de pantalla. */
  srValue?: string;
  /** Si se indica, muestra el cambio desde la última visita. */
  lastSeenKey?: string;
  /** Subir es bueno (volumen) o malo (gasto): decide el color del delta. */
  upIsGood?: boolean;
};

export function DisplayNumeral({
  value,
  format,
  label,
  caption,
  display,
  srValue,
  lastSeenKey,
  upIsGood = true,
}: DisplayNumeralProps) {
  const text = display ?? new Intl.NumberFormat('es-ES', format).format(value);

  return (
    <figure className="@container col-span-full">
      <p className="numeral" style={{ '--chars': text.length } as CSSProperties}>
        {/* La cifra visible rueda al cambiar; la de los lectores de pantalla ya es la final. */}
        <span aria-hidden="true">{display ?? <RollingNumber value={value} format={format} />}</span>
        <span className="sr-only">{`${label}: ${srValue ?? text}`}</span>
      </p>
      {caption || lastSeenKey ? (
        <figcaption className="mt-3 flex flex-wrap items-center gap-3 font-mono text-label text-ash uppercase">
          {caption}
          {lastSeenKey ? (
            <DeltaChip value={value} storageKey={lastSeenKey} format={format} upIsGood={upIsGood} />
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
