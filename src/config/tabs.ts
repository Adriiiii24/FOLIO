export const TABS = [
  { index: 1, slug: 'home', label: 'HOME', name: 'Inicio', href: '/home' },
  { index: 2, slug: 'gym', label: 'GYM', name: 'Entrenamiento', href: '/gym' },
  { index: 3, slug: 'vault', label: 'VAULT', name: 'Finanzas', href: '/vault' },
  { index: 4, slug: 'brain', label: 'BRAIN', name: 'Diario', href: '/brain' },
  { index: 5, slug: 'nutrition', label: 'NUTRITION', name: 'Nutrición', href: '/nutrition' },
  { index: 6, slug: 'media', label: 'MEDIA', name: 'Consumo cultural', href: '/media' },
  { index: 7, slug: 'routine', label: 'ROUTINE', name: 'Hábitos y foco', href: '/routine' },
  { index: 8, slug: 'settings', label: 'SETTINGS', name: 'Configuración', href: '/settings' },
] as const;

export type Tab = (typeof TABS)[number];
export type TabSlug = Tab['slug'];

export const formatIndex = (index: number) => String(index).padStart(2, '0');

export function tabForPath(pathname: string): Tab | undefined {
  return TABS.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
}
