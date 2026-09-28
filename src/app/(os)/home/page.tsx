import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrefillButton } from '@/components/ui/RowActions';
import { formatIndex, TABS, type TabSlug } from '@/config/tabs';
import { longDate, money, number, plural, posterDate } from '@/lib/format';
import { getHomeSheet } from '@/modules/home/queries';

export const metadata: Metadata = { title: 'HOME · Inicio' };

function tabOf(slug: TabSlug) {
  const tab = TABS.find((entry) => entry.slug === slug);
  if (!tab) throw new Error(`Pestaña desconocida: ${slug}`);
  return tab;
}

/** Ficha del índice: una por módulo, con su cifra y lo que significa. Toda la ficha lleva a su pestaña. */
function IndexCard({
  slug,
  figure,
  caption,
  children,
}: {
  slug: TabSlug;
  figure: string;
  caption: string;
  children?: ReactNode;
}) {
  const tab = tabOf(slug);
  return (
    <BrutalistCard
      variant="raised"
      href={tab.href}
      className="col-span-full flex flex-col justify-between gap-4 md:col-span-4 md:min-h-44 md:gap-6"
    >
      <h2 className="font-mono text-label text-ash uppercase">
        {formatIndex(tab.index)} <span aria-hidden="true">{'//'}</span> <span lang="en">{tab.label}</span>
        <span className="sr-only">, {tab.name}</span>
      </h2>
      <div>
        <p className="font-display text-[2.25rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{figure}</p>
        <p className="mt-2 font-mono text-label text-ash uppercase">{caption}</p>
        {children}
      </div>
    </BrutalistCard>
  );
}

export default async function HomePage() {
  const home = await getHomeSheet();
  const { gym, vault, brain, nutrition, media, routine } = home;
  const kcalLeft = nutrition.target === null ? null : nutrition.target - nutrition.eaten;

  return (
    <Sheet>
      <SheetHeader tab="home" meta={home.displayName ? `Hola, ${home.displayName}` : 'Centro de mando'} />
      <DisplayNumeral
        value={0}
        display={posterDate(home.today)}
        srValue={longDate(home.today)}
        label="Hoy"
        caption={longDate(home.today)}
      />

      {home.empty ? (
        <BrutalistCard title="Empieza por aquí" className="col-span-full">
          <p className="max-w-[65ch] text-body text-ash">
            FOLIO guarda ocho áreas de tu vida en un solo archivador. Lo más rápido es la barra de abajo: escribe una
            frase y FOLIO la convierte en un borrador que revisas antes de guardar. Prueba con uno de estos ejemplos.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrefillButton text="12,40 Mercadona" />
            <PrefillButton text="hecho: meditar" />
            <PrefillButton text="sentadilla 5x5 a 60" />
          </div>
          <p className="mt-5 max-w-[65ch] text-small text-ash">
            Lo que registras solo lo ves tú. Puedes exportarlo o borrarlo todo desde 08 // SETTINGS.
          </p>
        </BrutalistCard>
      ) : null}

      <IndexCard
        slug="gym"
        figure={`${number(gym.weekVolume)} kg`}
        caption={`Volumen · ${plural(gym.sessionsThisWeek, 'sesión', 'sesiones')} esta semana`}
      />
      <IndexCard
        slug="vault"
        figure={money(vault.spent, vault.currency)}
        caption={vault.budgetPct === null ? 'Gasto del mes' : `Gasto del mes · ${vault.budgetPct} % del presupuesto`}
      />
      <IndexCard
        slug="brain"
        figure={plural(brain.streak, 'día', 'días')}
        caption={`Racha de escritura · ${plural(brain.total, 'entrada', 'entradas')}`}
      />
      <IndexCard
        slug="nutrition"
        figure={kcalLeft === null ? `${number(nutrition.eaten)} kcal` : `${number(Math.abs(kcalLeft))} kcal`}
        caption={
          kcalLeft === null
            ? 'Comidas de hoy · sin objetivo'
            : kcalLeft >= 0
              ? 'Restantes hoy'
              : 'Por encima del objetivo'
        }
      />
      <IndexCard slug="media" figure={number(media.finishedThisYear)} caption={`Terminados en ${media.year}`} />
      <IndexCard
        slug="routine"
        figure={
          routine.bestStreak
            ? plural(routine.bestStreak.days, 'día', 'días')
            : `${routine.doneToday}/${routine.dailyCount}`
        }
        caption={routine.bestStreak ? `Racha · ${routine.bestStreak.name}` : 'Hábitos hechos hoy'}
      />

      <BrutalistCard
        title="Hoy"
        eyebrow={plural(home.timeline.length, 'registro', 'registros')}
        className="col-span-full"
      >
        {home.timeline.length > 0 ? (
          <ol className="divide-y-2 divide-line border-y-2 border-line">
            {home.timeline.map((entry) => {
              const tab = tabOf(entry.tab);
              return (
                <li
                  key={entry.key}
                  className="grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-0.5 py-3 @md:grid-cols-[3.5rem_9rem_1fr]"
                >
                  <time dateTime={entry.at} className="font-mono text-label text-ash">
                    {entry.time}
                  </time>
                  <Link
                    href={tab.href}
                    className="font-mono text-label text-ash uppercase underline-offset-4 hover:text-white hover:underline"
                  >
                    {formatIndex(tab.index)} <span lang="en">{tab.label}</span>
                  </Link>
                  <p className="col-start-2 truncate text-body @md:col-start-3">{entry.text}</p>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState>
            Todavía no has registrado nada hoy. Lo que guardes en cualquier pestaña aparecerá aquí, en orden.
          </EmptyState>
        )}
      </BrutalistCard>
    </Sheet>
  );
}
