import type { Metadata } from 'next';
import { EditHeading } from '@/components/ui/EditHeading';
import { ActionButton, RestTimer, SetForm, StartWorkoutForm, WorkoutEditForm } from '@/components/modules/gym/GymForms';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BarTable } from '@/components/ui/BarTable';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectField } from '@/components/ui/Field';
import { DeleteForm, PrefillButton } from '@/components/ui/RowActions';
import { Signal } from '@/components/ui/Signal';
import { localDate, localTime, utcIsoToZonedInput } from '@/lib/dates';
import { number, plural, shortDate } from '@/lib/format';
import { deleteSet, deleteWorkout, finishWorkout, repeatLastSet } from '@/modules/gym/actions';
import { getGymSheet } from '@/modules/gym/queries';

export const metadata: Metadata = { title: 'Gimnasio' };

const kg = (value: number) => `${number(value, 1)} kg`;

export default async function GymPage({ searchParams }: PageProps<'/gym'>) {
  const params = await searchParams;
  const gym = await getGymSheet(typeof params.ejercicio === 'string' ? params.ejercicio : undefined);
  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  const { overview, openWorkout } = gym;

  const change =
    overview.lastWeekVolume > 0
      ? Math.round(((overview.weekVolume - overview.lastWeekVolume) / overview.lastWeekVolume) * 100)
      : null;
  const byExercise = openWorkout
    ? [...Map.groupBy(openWorkout.sets, (set) => set.exercise.toLocaleLowerCase('es')).values()].map((sets) => ({
        exercise: sets[0]?.exercise ?? '',
        sets,
      }))
    : [];

  return (
    <Sheet>
      <SheetHeader tab="gym" meta={`Semana del ${shortDate(overview.weekFrom)}`} />
      <DisplayNumeral
        value={overview.weekVolume}
        format={{ style: 'unit', unit: 'kilogram', maximumFractionDigits: 0 }}
        label="Volumen de la semana"
        caption={`Volumen · ${plural(overview.sessionsThisWeek, 'sesión', 'sesiones')} esta semana`}
        lastSeenKey="gym.volume_week"
        upIsGood
      />
      {change !== null && change !== 0 ? (
        <div className="col-span-full -mt-2">
          <Signal tone={change > 0 ? 'up' : 'down'} glyph={change > 0 ? '▲' : '▼'}>
            {change > 0 ? '+' : '−'}
            {Math.abs(change)} % frente al mismo tramo de la semana pasada
          </Signal>
        </div>
      ) : null}

      <BrutalistCard
        title={openWorkout ? openWorkout.title : 'Sesión'}
        eyebrow={openWorkout ? `Desde las ${localTime(openWorkout.started_at, gym.timeZone)}` : undefined}
        className="col-span-full lg:col-span-7"
      >
        {openWorkout ? (
          <div className="flex flex-col gap-6">
            {byExercise.length > 0 ? (
              <ol className="divide-y-2 divide-line border-y-2 border-line">
                {byExercise.map(({ exercise, sets }) => (
                  <li key={exercise} className="py-3">
                    <p className="text-body font-semibold">{exercise}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {sets.map((set) => (
                        <li
                          key={set.id}
                          className={`flex items-center gap-2 border-2 py-1 pr-1 pl-2 font-mono text-label ${set.is_warmup ? 'border-line text-ash' : 'border-steel'}`}
                        >
                          <span>
                            {set.reps} × {kg(Number(set.weight_kg))}
                            {set.rpe ? ` · RPE ${number(Number(set.rpe), 1)}` : ''}
                            {set.is_warmup ? ' · calentamiento' : ''}
                          </span>
                          <DeleteForm
                            action={deleteSet.bind(null, set.id)}
                            label="Quitar"
                            confirmLabel="Sí, quitar"
                            quiet
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body text-ash">
                Sesión empezada. Añade la primera serie abajo o escríbela en la barra: «sentadilla 5x5 a 100».
              </p>
            )}
            <SetForm workoutId={openWorkout.id} exercises={gym.exercises} />
            <div className="flex flex-wrap gap-3 border-t-2 border-line pt-4">
              {openWorkout.sets.length > 0 ? (
                <ActionButton action={repeatLastSet.bind(null, openWorkout.id)} pendingLabel="Repitiendo…">
                  Repetir última serie
                </ActionButton>
              ) : null}
              <ActionButton action={finishWorkout.bind(null, openWorkout.id)} pendingLabel="Terminando…">
                Terminar sesión
              </ActionButton>
            </div>
            <RestTimer />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="max-w-[55ch] text-body text-ash">
              No hay ninguna sesión abierta. Empieza una y ve añadiendo series, o escribe directamente en la barra de
              abajo.
            </p>
            <StartWorkoutForm />
          </div>
        )}
      </BrutalistCard>

      <BrutalistCard title="Récords" eyebrow="1RM estimado · último año" className="col-span-full lg:col-span-5">
        {gym.records.length > 0 ? (
          <table className="w-full text-small">
            <caption className="sr-only">Mejor 1RM estimado por ejercicio (Epley)</caption>
            <thead>
              <tr className="font-mono text-micro text-ash uppercase">
                <th scope="col" className="pb-2 text-left font-normal">
                  Ejercicio
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  1RM
                </th>
                <th scope="col" className="pb-2 text-right font-normal">
                  Mejor serie
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-line">
              {gym.records.map((record) => (
                <tr key={record.exercise}>
                  <th scope="row" className="py-2 text-left font-normal">
                    {record.exercise}
                  </th>
                  <td className="py-2 text-right font-mono">{kg(record.e1rm)}</td>
                  <td className="py-2 text-right font-mono text-ash">
                    {record.reps} × {kg(record.weightKg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState actions={<PrefillButton text="press banca 4x8 a 60" />}>
            Tus récords aparecerán en cuanto registres series con peso.
          </EmptyState>
        )}
      </BrutalistCard>

      <BrutalistCard
        title="Progresión"
        eyebrow={gym.exercise ?? undefined}
        className="col-span-full lg:sticky lg:top-6 lg:col-span-7"
      >
        {gym.exercise ? (
          <div className="flex flex-col gap-5">
            <form action="/gym" className="flex flex-wrap items-end gap-3">
              <SelectField
                label="Ejercicio"
                name="ejercicio"
                options={gym.exercises.map((name) => ({ value: name, label: name }))}
                defaultValue={gym.exercise}
                className="min-w-56 flex-1"
              />
              <button type="submit" className={buttonClass({ tone: 'secondary' })}>
                Ver
              </button>
            </form>
            {gym.progress.length > 0 ? (
              <BarTable
                caption={`1RM estimado por sesión en ${gym.exercise}, últimos seis meses`}
                labelHeader="Sesión"
                valueHeader="1RM estimado"
                rows={gym.progress.map((row, index) => ({
                  key: row.workout_id,
                  label: shortDate(row.performed_on),
                  value: Number(row.best_e1rm_kg),
                  formatted: kg(Number(row.best_e1rm_kg)),
                  current: index === gym.progress.length - 1,
                }))}
              />
            ) : (
              <EmptyState>Sin series de trabajo de {gym.exercise} en los últimos seis meses.</EmptyState>
            )}
          </div>
        ) : (
          <EmptyState>
            Cuando repitas un ejercicio en varias sesiones, aquí verás si progresas: el 1RM estimado de cada sesión.
          </EmptyState>
        )}
      </BrutalistCard>

      <BrutalistCard title="Historial" eyebrow="Últimas sesiones" className="col-span-full lg:col-span-5">
        {gym.recent.length > 0 ? (
          <ol className="divide-y-2 divide-line border-y-2 border-line">
            {gym.recent.map((workout) =>
              workout.id === editId ? (
                <li key={workout.id} className="flex flex-col gap-4 py-4">
                  <EditHeading className="">
                    {workout.title} · {shortDate(localDate(gym.timeZone, new Date(workout.started_at)))}
                  </EditHeading>
                  <WorkoutEditForm
                    initial={{
                      id: workout.id,
                      title: workout.title,
                      startedAt: utcIsoToZonedInput(workout.started_at, gym.timeZone),
                      perceivedEffort: workout.perceived_effort === null ? '' : String(workout.perceived_effort),
                      notes: workout.notes ?? '',
                    }}
                    doneHref="/gym"
                    secondaryAction={
                      <ButtonLink href="/gym" scroll={false} tone="quiet">
                        Cancelar
                      </ButtonLink>
                    }
                  />
                  <DeleteForm action={deleteWorkout.bind(null, workout.id)} label="Borrar sesión" />
                </li>
              ) : (
                <li key={workout.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-body">{workout.title}</p>
                    <p className="font-mono text-label text-ash uppercase">
                      {shortDate(localDate(gym.timeZone, new Date(workout.started_at)))} ·{' '}
                      {plural(workout.setCount, 'serie', 'series')} · {number(workout.volume)} kg
                      {workout.ended_at ? '' : ' · abierta'}
                    </p>
                  </div>
                  <ButtonLink
                    href={`/gym?edit=${workout.id}`}
                    scroll={false}
                    tone="quiet"
                    className="h-8 min-w-0 px-0"
                    aria-label={`Editar ${workout.title}`}
                  >
                    Editar
                  </ButtonLink>
                </li>
              ),
            )}
          </ol>
        ) : (
          <EmptyState>Aún no hay sesiones.</EmptyState>
        )}
      </BrutalistCard>
    </Sheet>
  );
}
