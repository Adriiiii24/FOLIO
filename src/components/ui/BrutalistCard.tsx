import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'flat' | 'raised' | 'paper';

const VARIANT: Record<Variant, string> = {
  flat: 'border-line bg-structure text-white',
  raised: 'border-white bg-structure text-white shadow-hard',
  paper: 'border-black bg-white text-black shadow-hard',
};

const MUTED: Record<Variant, string> = {
  flat: 'text-ash',
  raised: 'text-ash',
  paper: 'text-steel',
};

const PRESSABLE = [
  'transition-[translate,box-shadow] duration-(--duration-fast) ease-out-strong',
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg',
  'active:translate-x-1 active:translate-y-1 active:shadow-none active:duration-(--duration-press)',
].join(' ');

type BrutalistCardProps = {
  variant?: Variant;
  title?: string;
  eyebrow?: string;
  href?: string;
  className?: string;
  children: ReactNode;
};

export function BrutalistCard({
  variant = 'flat',
  title,
  eyebrow,
  href,
  className = '',
  children,
}: BrutalistCardProps) {
  const classes = [
    '@container relative block border-2 p-4 lg:p-5',
    VARIANT[variant],
    href ? PRESSABLE : '',
    className,
  ].join(' ');
  const surface = variant === 'paper' ? 'paper' : undefined;

  const content = (
    <>
      {(title || eyebrow) && (
        <header className="mb-4 flex items-baseline justify-between gap-4">
          {title ? <h2 className="text-title font-semibold">{title}</h2> : null}
          {eyebrow ? <p className={`font-mono text-micro uppercase ${MUTED[variant]}`}>{eyebrow}</p> : null}
        </header>
      )}
      {children}
    </>
  );

  return href ? (
    <Link href={href} data-surface={surface} className={classes}>
      {content}
    </Link>
  ) : (
    <section data-surface={surface} className={classes}>
      {content}
    </section>
  );
}
