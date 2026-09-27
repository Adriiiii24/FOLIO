import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { signOut } from '@/modules/auth/actions';

// Grupo protegido: el archivador. El proxy ya redirige sin sesión; esto es la segunda barrera.
// Shell provisional: FolderShell (SystemBar + FolderTabs + QuickInputDock) llega en la Fase 2.
export default async function OsLayout({ children }: { children: ReactNode }) {
  if (!(await requireUserId(await createClient()))) redirect('/login');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 p-4">
        <span className="font-mono text-sm">DOSSIER_OS</span>
        <form action={signOut}>
          <button type="submit" className="border-2 px-3 py-2">
            Cerrar sesión
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
