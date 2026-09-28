import { FolioMark } from '@/components/ui/FolioMark';
import { LocalClock, OnlineStatus } from './SystemStatus';

/** Microtipografía de esquina sobre el canvas: marca, fecha y hora locales y punto de estado (§5.1). */
export function SystemBar({ displayName, timeZone }: { displayName: string | null; timeZone: string }) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 font-mono text-micro text-black uppercase lg:px-0">
      <p className="flex min-w-0 items-center gap-2">
        <FolioMark className="h-3 w-auto shrink-0" />
        <span className="font-semibold tracking-[0.14em]">FOLIO</span>
        {displayName ? <span className="hidden truncate md:inline">/ {displayName}</span> : null}
      </p>
      <LocalClock timeZone={timeZone} initialIso={new Date().toISOString()} />
      <div className="justify-self-end">
        <OnlineStatus />
      </div>
    </header>
  );
}
