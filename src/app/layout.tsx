import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Provisional hasta la Fase 2: fonts.ts, tokens de globals.css y MotionProvider (DESIGN_SYSTEM §9).
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'DOSSIER_OS', template: '%s · DOSSIER_OS' },
  description: 'Sistema operativo personal.',
};

export const viewport: Viewport = {
  themeColor: '#FF3B00',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
