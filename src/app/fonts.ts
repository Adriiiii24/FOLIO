import { Geist, Geist_Mono, Inter_Tight } from 'next/font/google';

// Display: Helvetica Now Display (decisión del autor, PRODUCT.md). Requiere licencia web y sus .woff2
// no pueden ir al repositorio público. Hasta tenerlos, Inter Tight hace de sustituto temporal: grotesca
// neutra, autoalojada por next/font y con cortes hasta Black. Con los archivos, este export pasa a ser
// el localFont de DESIGN_SYSTEM §3.2; la variable CSS no cambia y ningún componente se entera.
export const displayFace = Inter_Tight({ subsets: ['latin'], variable: '--font-display-face', display: 'swap' });
export const sansFace = Geist({ subsets: ['latin'], variable: '--font-sans-face', display: 'swap' });
export const monoFace = Geist_Mono({ subsets: ['latin'], variable: '--font-mono-face', display: 'swap' });

export const fontVariables = `${displayFace.variable} ${sansFace.variable} ${monoFace.variable}`;
