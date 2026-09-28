'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { TABS, formatIndex, tabForPath } from '@/config/tabs';

export function FolderTabs() {
  const pathname = usePathname();
  const active = tabForPath(pathname);
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // En móvil la tira desliza: la pestaña activa queda siempre a la vista, sin animar el scroll.
    // Se desplaza solo la tira, y solo si desborda. scrollIntoView() movía además el punto de inicio de la
    // navegación con Tab a la pestaña activa, y el primer Tab se saltaba el enlace «Saltar al contenido».
    const link = activeLink.current;
    const list = link?.closest('ol');
    if (!link || !list || list.scrollWidth <= list.clientWidth) return;
    const left = link.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + link.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = left - 16;
    }
  }, [active?.slug]);

  return (
    <nav aria-label="Módulos" className="folder-tabs">
      <ol className="folder-tabs__list">
        {TABS.map((tab) => {
          const isActive = tab.slug === active?.slug;
          // La dirección del deslizamiento sale del orden físico de las carpetas.
          const direction = active && tab.index < active.index ? 'nav-back' : 'nav-forward';

          return (
            <li key={tab.slug}>
              <Link
                ref={isActive ? activeLink : undefined}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                transitionTypes={isActive ? undefined : [direction]}
                className="folder-tab"
              >
                <span className="folder-tab__label">
                  <span>{formatIndex(tab.index)}</span>
                  <span className="folder-tab__sep" aria-hidden="true">
                    {'//'}
                  </span>
                  <span className="folder-tab__name">{tab.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
