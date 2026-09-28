'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { easeOutStrong, exitFast, springSnap } from '@/lib/motion/tokens';

function clockText(timeZone: string, at: Date, withYear: boolean): string {
  const get = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-ES', { timeZone, ...options }).format(at);
  const weekday = get({ weekday: 'short' }).replace('.', '').toUpperCase();
  const date = `${get({ day: '2-digit' })}·${get({ month: '2-digit' })}${withYear ? `·${get({ year: 'numeric' })}` : ''}`;
  const time = get({ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  return `${weekday} ${date} ${time}`;
}

/**
 * Fecha y hora con segundos en la zona del perfil. El primer render usa la hora del servidor (sin desajuste
 * de hidratación); al montar se corrige y después cambia justo al empezar cada segundo, sin animación: es un
 * reloj, no un espectáculo. La mono mantiene el ancho fijo, así que el segundero no mueve nada.
 */
export function LocalClock({ timeZone, initialIso }: { timeZone: string; initialIso: string }) {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // Un setTimeout por segundo, alineado con el reloj del sistema: un setInterval deriva y salta segundos.
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <time dateTime={now.toISOString()} suppressHydrationWarning className="tabular-nums">
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

const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Ausente cuando pasan `idleMs` sin tocar el ratón, el teclado ni la rueda, o en cuanto la ventana deja de
 * tener el foco (otra pestaña, otra aplicación). Los eventos solo apuntan la hora: un único temporizador
 * comprueba el silencio, en vez de reiniciarse con cada movimiento del ratón.
 */
function useAway(idleMs: number): boolean {
  const [away, setAway] = useState(false);

  useEffect(() => {
    let last = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isAway = false;
    const set = (value: boolean) => {
      if (value === isAway) return;
      isAway = value;
      setAway(value);
    };
    const attending = () => document.visibilityState === 'visible' && document.hasFocus();

    function check() {
      timer = undefined;
      if (!attending()) return set(true);
      const idle = Date.now() - last;
      if (idle >= idleMs) set(true);
      else timer = setTimeout(check, idleMs - idle);
    }
    function onActivity() {
      last = Date.now();
      if (!attending()) return;
      set(false);
      timer ??= setTimeout(check, idleMs);
    }
    function onAttention() {
      if (attending()) return onActivity();
      clearTimeout(timer);
      timer = undefined;
      set(true);
    }

    // La primera comprobación va fuera del efecto: una pestaña abierta en segundo plano empieza ausente.
    // Con su propio temporizador: `timer` solo guarda la comprobación de silencio pendiente.
    const first = setTimeout(onAttention, 0);
    for (const type of ACTIVITY) window.addEventListener(type, onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true, capture: true });
    window.addEventListener('focus', onAttention);
    window.addEventListener('blur', onAttention);
    document.addEventListener('visibilitychange', onAttention);
    return () => {
      clearTimeout(first);
      clearTimeout(timer);
      for (const type of ACTIVITY) window.removeEventListener(type, onActivity);
      window.removeEventListener('scroll', onActivity, { capture: true });
      window.removeEventListener('focus', onAttention);
      window.removeEventListener('blur', onAttention);
      document.removeEventListener('visibilitychange', onAttention);
    };
  }, [idleMs]);

  return away;
}

type Presence = 'online' | 'away' | 'offline';

const PRESENCE_LABEL: Record<Presence, string> = {
  online: 'En línea',
  away: 'Ausente',
  offline: 'Sin conexión',
};

/**
 * Punto de estado de la barra de sistema, anclado a la esquina: lleno en línea, hueco ausente y tachado sin
 * conexión. El texto va delante para que el punto no se desplace al cambiar. Solo la pérdida de red se
 * anuncia a los lectores de pantalla: «ausente» cambiaría cada medio minuto y sería ruido.
 */
export function OnlineStatus() {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const away = useAway(30_000);
  const presence: Presence = !online ? 'offline' : away ? 'away' : 'online';

  return (
    <div className="flex items-center gap-2">
      <span className={presence === 'offline' ? undefined : 'sr-only md:not-sr-only'}>
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={presence}
            className="block"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: easeOutStrong } }}
            exit={{ opacity: 0, y: 4, transition: exitFast }}
          >
            {PRESENCE_LABEL[presence]}
          </m.span>
        </AnimatePresence>
      </span>
      <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5 shrink-0 overflow-visible">
        <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <m.circle
          cx="5"
          cy="5"
          r="4"
          fill="currentColor"
          initial={false}
          animate={{ scale: presence === 'online' ? 1 : 0 }}
          transition={springSnap}
        />
        <m.path
          d="M1.5 8.5 8.5 1.5"
          stroke="currentColor"
          strokeWidth="2"
          initial={false}
          animate={{ pathLength: presence === 'offline' ? 1 : 0, opacity: presence === 'offline' ? 1 : 0 }}
          transition={{ duration: 0.24, ease: easeOutStrong }}
        />
      </svg>
      <span role="status" className="sr-only">
        {online ? '' : 'Sin conexión'}
      </span>
    </div>
  );
}
