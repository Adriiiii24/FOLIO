import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';

type Tone = 'primary' | 'secondary' | 'danger' | 'quiet';
type Surface = 'folder' | 'paper';

const BASE =
  'inline-flex h-11 min-w-11 items-center justify-center gap-2 border-2 px-4 font-mono text-label uppercase whitespace-nowrap select-none disabled:cursor-not-allowed';

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
    primary: `border-black bg-black text-white disabled:border-steel disabled:bg-steel ${PRESS}`,
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
