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
    activeLink.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
                  <span className="folder-tab__name" lang="en">
                    {tab.label}
                  </span>
                  <span className="sr-only">, {tab.name}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
