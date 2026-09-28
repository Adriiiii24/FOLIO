'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

function clockText(timeZone: string, at: Date, withYear: boolean): string {
  const get = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-ES', { timeZone, ...options }).format(at);
  const weekday = get({ weekday: 'short' }).replace('.', '').toUpperCase();
  const date = `${get({ day: '2-digit' })}·${get({ month: '2-digit' })}${withYear ? `·${get({ year: 'numeric' })}` : ''}`;
  const time = get({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${weekday} ${date} ${time}`;
}

/**
 * Fecha y hora en la zona del perfil. El primer render usa la hora del servidor (sin desajuste de
 * hidratación); luego cambia justo al empezar cada minuto, sin animación: es un reloj, no un espectáculo.
 */
export function LocalClock({ timeZone, initialIso }: { timeZone: string; initialIso: string }) {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(new Date());
    const toNextMinute = setTimeout(
      () => {
        tick();
        interval = setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(toNextMinute);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <time dateTime={now.toISOString()} suppressHydrationWarning>
      <span className="lg:hidden">{clockText(timeZone, now, false)}</span>
      <span className="hidden lg:inline">{clockText(timeZone, now, true)}</span>
    </time>
  );
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** Punto de estado de la barra de sistema: fijo en línea; hueco y con texto cuando se pierde la red. */
export function OnlineStatus() {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

  return (
    <p role="status" className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full border-2 border-black ${online ? 'bg-black' : 'bg-transparent'}`}
      />
      <span className={online ? 'sr-only md:not-sr-only' : undefined}>{online ? 'En línea' : 'Sin conexión'}</span>
    </p>
  );
}
