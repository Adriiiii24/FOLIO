import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';

type Tone = 'primary' | 'secondary' | 'danger' | 'quiet';
type Surface = 'folder' | 'paper';

// No encogen junto a un campo (shrink-0) y nunca pasan del ancho de su contenedor: si la etiqueta no cabe,
// se parte en dos líneas centradas en vez de salirse de la ficha («Cerrar sesión en todos los dispositivos»).
const BASE =
  'inline-flex min-h-11 max-w-full min-w-11 shrink-0 items-center justify-center gap-2 border-2 px-4 py-2 text-center font-mono text-label text-balance uppercase select-none disabled:cursor-not-allowed';

// Lo pulsable principal lleva sombra dura en la tinta de la superficie y se hunde en ella al pulsar (§6.4).
const PRESS =
  'shadow-hard transition-[translate,box-shadow] duration-(--duration-fast) ease-out-strong active:translate-x-1 active:translate-y-1 active:shadow-none active:duration-(--duration-press) disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0';

const TONES: Record<Surface, Record<Tone, string>> = {
  folder: {
    primary: `border-white bg-white text-black disabled:border-steel disabled:bg-steel ${PRESS}`,
    secondary: 'border-steel text-white hover:border-white disabled:text-ash',
    danger: 'border-signal-down text-signal-down disabled:border-steel disabled:text-ash',
    quiet: 'border-transparent text-ash underline underline-offset-4 hover:text-white',
  },
  paper: {
    // Sin sombra: un bloque negro con sombra negra sobre papel se lee como un fallo de impresión, no como relieve.
    primary:
      'border-black bg-black text-white hover:bg-steel hover:border-steel active:translate-y-px disabled:border-steel disabled:bg-steel',
    secondary: 'border-black text-black disabled:border-steel disabled:text-steel',
    danger: 'border-black text-black disabled:text-steel',
    quiet: 'border-transparent text-steel underline underline-offset-4 hover:text-black',
  },
};

export function buttonClass({
  tone = 'secondary',
  surface = 'folder',
  className = '',
}: { tone?: Tone; surface?: Surface; className?: string } = {}) {
  return `${BASE} ${TONES[surface][tone]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; surface?: Surface };

export function Button({ tone, surface, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ tone, surface, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { tone?: Tone; surface?: Surface };

export function ButtonLink({ tone, surface, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass({ tone, surface, className })} {...props} />;
}
