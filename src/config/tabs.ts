// `label` es el título visible (en mayúsculas por CSS) y el de la pestaña del navegador; `name` describe
// el área para el modelo. Las rutas conservan el slug en inglés: cambiarlas rompería enlaces guardados.
export const TABS = [
  { index: 1, slug: 'home', label: 'Inicio', name: 'Inicio', href: '/home' },
  { index: 2, slug: 'gym', label: 'Gimnasio', name: 'Entrenamiento', href: '/gym' },
  { index: 3, slug: 'vault', label: 'Finanzas', name: 'Finanzas', href: '/vault' },
  { index: 4, slug: 'brain', label: 'Diario', name: 'Diario', href: '/brain' },
  { index: 5, slug: 'nutrition', label: 'Nutrición', name: 'Nutrición', href: '/nutrition' },
  { index: 6, slug: 'media', label: 'Cultura', name: 'Consumo cultural', href: '/media' },
  { index: 7, slug: 'routine', label: 'Rutina', name: 'Hábitos y foco', href: '/routine' },
  { index: 8, slug: 'settings', label: 'Ajustes', name: 'Configuración', href: '/settings' },
] as const;

export type Tab = (typeof TABS)[number];
export type TabSlug = Tab['slug'];

export const formatIndex = (index: number) => String(index).padStart(2, '0');

export function tabForPath(pathname: string): Tab | undefined {
  return TABS.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
}
