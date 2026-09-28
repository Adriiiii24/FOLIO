import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main data-surface="canvas" className="grid min-h-dvh content-center gap-6 px-4 md:px-6 lg:px-8">
      <p className="font-mono text-micro uppercase">FOLIO · Error 404</p>
      <h1 className="font-display text-headline font-bold">Esta carpeta no existe.</h1>
      <p className="max-w-[48ch] text-body">La dirección no corresponde a ninguna pestaña del archivador.</p>
      <Link href="/home" className={buttonClass({ tone: 'primary', surface: 'paper', className: 'w-fit' })}>
        Ir a 01 // HOME
      </Link>
    </main>
  );
}
