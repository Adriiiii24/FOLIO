import type { Metadata } from 'next';
import { EditHeading } from '@/components/ui/EditHeading';
import { FocusTimer, HabitForm, HabitToggle } from '@/components/modules/routine/RoutineControls';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BarTable } from '@/components/ui/BarTable';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { ButtonLink } from '@/components/ui/Button';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeleteForm, PrefillButton } from '@/components/ui/RowActions';
import { localTime } from '@/lib/dates';
import { minutes, plural, shortDate, weekdayShort } from '@/lib/format';
import { archiveHabit, deleteHabit } from '@/modules/routine/actions';
import { getRoutineSheet } from '@/modules/routine/queries';

export const metadata: Metadata = { title: 'ROUTINE · Hábitos y foco' };

export default async function RoutinePage({ searchParams }: PageProps<'/routine'>) {
  const params = await searchParams;
  const routine = await getRoutineSheet();
  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  const daily = routine.habits.filter((habit) => habit.cadence === 'daily');
  const weekly = routine.habits.filter((habit) => habit.cadence === 'weekly');
  const focusTotal = routine.focusDays.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <Sheet>
      <SheetHeader tab="routine" meta={`Hoy · ${routine.doneToday} de ${routine.dailyCount} hábitos`} />
      <DisplayNumeral
        value={routine.bestStreak?.days ?? 0}
        display={plural(routine.bestStreak?.days ?? 0, 'día', 'días')}
        label="Racha activa"
        caption={
          routine.bestStreak
            ? `Racha activa · ${routine.bestStreak.name}`
            : 'Racha activa · marca un hábito hoy para empezarla'
        }
        lastSeenKey="routine.best_streak"
        upIsGood
      />

      <BrutalistCard
        title="Hoy"
        eyebrow={`${routine.doneToday}/${routine.dailyCount}`}
        className="col-span-full lg:col-span-6"
      >
        {routine.habits.length > 0 ? (
          <div className="flex flex-col gap-6">
            {daily.length > 0 ? (
              <ul className="divide-y-2 divide-line border-y-2 border-line">
                {daily.map((habit) => (
                  <HabitToggle
                    key={habit.id}
                    habitId={habit.id}
                    name={habit.name}
                    done={habit.doneToday}
                    streak={habit.streak}
                    meta="Diario"
                  />
                ))}
              </ul>
            ) : null}
            {weekly.length > 0 ? (
              <div>
                <h3 className="mb-2 font-mono text-label text-ash uppercase">Esta semana</h3>
                <ul className="divide-y-2 divide-line border-y-2 border-line">
                  {weekly.map((habit) => (
                    <HabitToggle
                      key={habit.id}
                      habitId={habit.id}
                      name={habit.name}
                      done={habit.doneToday}
                      streak={0}
                      meta={`Semanal · ${habit.doneThisWeek} de ${habit.target_per_period}${habit.doneThisWeek >= habit.target_per_period ? ' · cumplido' : ''}`}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState actions={<PrefillButton text="hecho: meditar" />}>
            Sin hábitos todavía. Crea uno abajo o escribe «hecho: …» en la barra: si no existe, FOLIO lo crea y lo
            marca.
          </EmptyState>
        )}
      </BrutalistCard>

      <BrutalistCard
        title="Foco"
        eyebrow={
          routine.activeFocus
            ? `Desde las ${localTime(routine.activeFocus.started_at, routine.timeZone)}`
            : `${minutes(focusTotal)} en 7 días`
        }
        className="col-span-full lg:col-span-6"
      >
        <div className="flex flex-col gap-6">
          <FocusTimer active={routine.activeFocus} />
          {routine.focusToday.length > 0 ? (
            <ul className="divide-y-2 divide-line border-y-2 border-line">
              {routine.focusToday.map((session) => (
                <li
                  key={session.id}
                  className="flex items-baseline justify-between gap-4 py-2 font-mono text-label uppercase"
                >
                  <span className="text-ash">{localTime(session.started_at, routine.timeZone)}</span>
                  <span className="min-w-0 flex-1 truncate normal-case">{session.label ?? 'Foco'}</span>
                  <span>{minutes((session.duration_s ?? 0) / 60)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </BrutalistCard>

      <BrutalistCard title="Minutos de foco" eyebrow="Últimos 7 días" className="col-span-full lg:col-span-6">
        {focusTotal > 0 ? (
          <BarTable
            caption="Minutos de foco por día, últimos siete días"
            labelHeader="Día"
            valueHeader="Minutos"
            rows={routine.focusDays.map((day) => ({
              key: day.day,
              label: `${weekdayShort(day.day)} ${shortDate(day.day)}`,
              value: day.minutes,
              formatted: minutes(day.minutes),
              current: day.day === routine.today,
            }))}
          />
        ) : (
          <EmptyState>Cuando termines sesiones de foco, aquí verás cuánto trabajo profundo haces cada día.</EmptyState>
        )}
      </BrutalistCard>

      <BrutalistCard title="Hábitos" eyebrow="Crear y editar" className="col-span-full lg:col-span-6">
        <div className="flex flex-col gap-6">
          <HabitForm />
          {routine.habits.length > 0 ? (
            <ol className="divide-y-2 divide-line border-y-2 border-line">
              {routine.habits.map((habit) =>
                habit.id === editId ? (
                  <li key={habit.id} className="flex flex-col gap-4 py-4">
                    <EditHeading className="">{habit.name}</EditHeading>
                    <HabitForm
                      initial={{
                        id: habit.id,
                        name: habit.name,
                        cadence: habit.cadence,
                        targetPerPeriod: String(habit.target_per_period),
                      }}
                      doneHref="/routine"
                      secondaryAction={
                        <ButtonLink href="/routine" scroll={false} tone="quiet">
                          Cancelar
                        </ButtonLink>
                      }
                    />
                    <div className="flex flex-wrap gap-3">
                      <DeleteForm
                        action={archiveHabit.bind(null, habit.id)}
                        label="Archivar"
                        confirmLabel="Sí, archivar"
                      />
                      <DeleteForm action={deleteHabit.bind(null, habit.id)} label="Borrar con su historial" />
                    </div>
                  </li>
                ) : (
                  <li key={habit.id} className="flex items-baseline justify-between gap-4 py-3">
                    <p className="min-w-0 truncate text-body">
                      {habit.name}
                      <span className="ml-2 font-mono text-label text-ash uppercase">
                        {habit.cadence === 'daily' ? 'Diario' : `Semanal · ${habit.target_per_period} veces`}
                      </span>
                    </p>
                    <ButtonLink
                      href={`/routine?edit=${habit.id}`}
                      scroll={false}
                      tone="quiet"
                      className="h-8 min-w-0 shrink-0 px-0"
                      aria-label={`Editar ${habit.name}`}
                    >
                      Editar
                    </ButtonLink>
                  </li>
                ),
              )}
            </ol>
          ) : null}
        </div>
      </BrutalistCard>
    </Sheet>
  );
}
