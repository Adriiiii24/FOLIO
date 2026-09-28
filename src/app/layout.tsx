import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'FOLIO', template: '%s · FOLIO' },
  description: 'Sistema operativo personal: ocho áreas de tu vida en un solo archivador.',
};

export const viewport: Viewport = {
  themeColor: '#FF3B00',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
