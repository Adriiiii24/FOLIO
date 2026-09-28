'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TABS } from '@/config/tabs';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
export const SINGLE_KEY_SHORTCUTS_KEY = 'dossier:single-key-shortcuts';

function singleKeyShortcutsEnabled() {
  try {
    return localStorage.getItem(SINGLE_KEY_SHORTCUTS_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function TabShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || EDITABLE_TAGS.has(target.tagName))) return;
      if (!singleKeyShortcutsEnabled()) return;

      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('quick-input')?.focus();
        return;
      }

      const tab = TABS[Number(event.key) - 1];
      if (tab && /^[1-8]$/.test(event.key)) {
        event.preventDefault();
        // Sin transitionTypes: con teclado la lámina cambia al instante.
        router.push(tab.href);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return null;
}
