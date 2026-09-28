import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { FolderTabs } from '@/components/os/FolderTabs';
import { QuickInputDock } from '@/components/os/QuickInputDock';
import { SystemBar } from '@/components/os/SystemBar';
import { TabShortcuts } from '@/components/os/TabShortcuts';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';

// FolderShell (DESIGN_SYSTEM §5.1): persiste entre pestañas; solo cambia la lámina.
// El proxy ya redirige sin sesión; comprobarlo aquí es la segunda barrera.
export default async function OsLayout({ children }: { children: ReactNode }) {
  if (!(await requireUserId(await createClient()))) redirect('/login');
  const profile = await getProfile();

  return (
    // grid-cols-[minmax(0,1fr)]: sin plantilla, la columna implícita crece hasta el ancho mínimo del contenido
    // (la tira de pestañas, una tabla) y en móvil toda la carpeta desbordaba en horizontal.
    <div
      data-surface="canvas"
      className="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_1fr] lg:px-6 lg:pb-6"
    >
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:bg-black focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <SystemBar displayName={profile.display_name} timeZone={profile.timezone} />
      <FolderTabs />
      <main
        id="contenido"
        data-surface="folder"
        className="relative flex flex-col pb-[calc(var(--quick-bar-height)+env(safe-area-inset-bottom))]"
      >
        {children}
        <QuickInputDock />
      </main>
      <TabShortcuts />
    </div>
  );
}
