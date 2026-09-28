import type { Metadata } from 'next';
import { EditHeading } from '@/components/ui/EditHeading';
import { MealForm } from '@/components/modules/nutrition/MealForm';
import { Sheet } from '@/components/os/Sheet';
import { SheetHeader } from '@/components/os/SheetHeader';
import { BarTable } from '@/components/ui/BarTable';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { ButtonLink } from '@/components/ui/Button';
import { DisplayNumeral } from '@/components/ui/DisplayNumeral';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeleteForm, PrefillButton } from '@/components/ui/RowActions';
import { Signal } from '@/components/ui/Signal';
import { localDate, localTime, utcIsoToZonedInput } from '@/lib/dates';
import { number, shortDate, weekdayShort } from '@/lib/format';
import { deleteMeal } from '@/modules/nutrition/actions';
import { atwaterWarning, MEAL_TYPE_LABEL, mealTypeForHour } from '@/modules/nutrition/form';
import { getNutritionSheet } from '@/modules/nutrition/queries';

export const metadata: Metadata = { title: 'NUTRITION · Nutrición' };

export default async function NutritionPage({ searchParams }: PageProps<'/nutrition'>) {
  const params = await searchParams;
  const nutrition = await getNutritionSheet();
  const editId = typeof params.edit === 'string' ? params.edit : undefined;
  const { todayTotals: today, targets } = nutrition;

  const now = utcIsoToZonedInput(new Date().toISOString(), nutrition.timeZone);
  const defaultMealType = mealTypeForHour(Number(now.slice(11, 13)));
  const left = targets.kcal === null ? null : targets.kcal - today.kcal;

  const macros = [
    { key: 'protein', label: 'Proteína', value: today.protein, target: targets.protein },
    { key: 'carbs', label: 'Carbohidratos', value: today.carbs, target: targets.carbs },
    { key: 'fat', label: 'Grasa', value: today.fat, target: targets.fat },
  ];

  return (
    <Sheet>
      <SheetHeader tab="nutrition" meta="Hoy" />
      {left === null ? (
        <DisplayNumeral
          value={today.kcal}
          format={{ maximumFractionDigits: 0 }}
          display={`${number(today.kcal)} kcal`}
          label="Kcal de hoy"
          caption="Comidas de hoy · define tu objetivo en 08 // SETTINGS"
        />
      ) : (
        <DisplayNumeral
          value={Math.abs(left)}
          display={`${left < 0 ? '−' : ''}${number(Math.abs(left))} kcal`}
          srValue={left < 0 ? `${number(-left)} kcal por encima del objetivo` : `${number(left)} kcal restantes`}
          label="Kcal restantes hoy"
          caption={`${left >= 0 ? 'Restantes hoy' : 'Por encima del objetivo'} · ${number(today.kcal)} de ${number(targets.kcal ?? 0)}`}
        />
      )}
      {left !== null && left < 0 ? (
        <div className="col-span-full -mt-2">
          <Signal tone="warn">Has pasado el objetivo diario</Signal>
        </div>
      ) : null}

      <BrutalistCard title="Nueva comida" className="col-span-full lg:col-span-7">
        <MealForm defaultEatenAt={now} defaultMealType={defaultMealType} />
      </BrutalistCard>

      <BrutalistCard
        title="Macros de hoy"
        eyebrow={targets.protein === null ? 'Sin objetivos' : 'Frente al objetivo'}
        className="col-span-full lg:col-span-5"
      >
        <BarTable
          caption="Gramos de cada macronutriente hoy"
          labelHeader="Macronutriente"
          valueHeader="Gramos"
          max={Math.max(...macros.map((macro) => macro.target ?? 0), ...macros.map((macro) => macro.value), 1)}
          rows={macros.map((macro) => ({
            key: macro.key,
            label: macro.label,
            value: macro.value,
            formatted:
              macro.target === null ? `${number(macro.value)} g` : `${number(macro.value)} / ${number(macro.target)} g`,
          }))}
        />
        <p className="mt-4 text-small text-ash">Estimaciones orientativas, no consejo nutricional.</p>
      </BrutalistCard>

      <BrutalistCard title="Últimos 7 días" eyebrow="Kcal por día" className="col-span-full lg:col-span-5">
        <BarTable
          caption="Kcal por día, últimos siete días"
          labelHeader="Día"
          valueHeader="Kcal"
          reference={
            targets.kcal === null ? undefined : { value: targets.kcal, label: `Objetivo: ${number(targets.kcal)} kcal` }
          }
          rows={nutrition.days.map((day) => ({
            key: day.day,
            label: `${weekdayShort(day.day)} ${shortDate(day.day)}`,
            value: day.kcal,
            formatted: `${number(day.kcal)} kcal`,
            current: day.day === nutrition.today,
          }))}
        />
      </BrutalistCard>

      <BrutalistCard title="Comidas" eyebrow="Últimos 7 días" className="col-span-full lg:col-span-7">
        {nutrition.meals.length > 0 ? (
          <ol className="divide-y-2 divide-line border-y-2 border-line">
            {nutrition.meals.map((meal) => {
              if (meal.id === editId) {
                return (
                  <li key={meal.id} className="flex flex-col gap-4 py-4">
                    <EditHeading className="">
                      {meal.description} · {shortDate(localDate(nutrition.timeZone, new Date(meal.eaten_at)))}
                    </EditHeading>
                    <MealForm
                      defaultEatenAt={now}
                      defaultMealType={defaultMealType}
                      initial={{
                        id: meal.id,
                        mealType: meal.meal_type,
                        description: meal.description,
                        caloriesKcal: String(meal.calories_kcal),
                        proteinG: String(meal.protein_g).replace('.', ','),
                        carbsG: String(meal.carbs_g).replace('.', ','),
                        fatG: String(meal.fat_g).replace('.', ','),
                        eatenAt: utcIsoToZonedInput(meal.eaten_at, nutrition.timeZone),
                      }}
                      doneHref="/nutrition"
                      secondaryAction={
                        <ButtonLink href="/nutrition" scroll={false} tone="quiet">
                          Cancelar
                        </ButtonLink>
                      }
                    />
                    <DeleteForm action={deleteMeal.bind(null, meal.id)} label="Borrar comida" />
                  </li>
                );
              }
              const warning = atwaterWarning(
                meal.calories_kcal,
                Number(meal.protein_g),
                Number(meal.carbs_g),
                Number(meal.fat_g),
              );
              return (
                <li key={meal.id} className="grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-3">
                  <p className="font-mono text-label text-ash uppercase">
                    <span className="block">{shortDate(localDate(nutrition.timeZone, new Date(meal.eaten_at)))}</span>
                    <span className="block">{localTime(meal.eaten_at, nutrition.timeZone)}</span>
                  </p>
                  <div className="min-w-0">
                    <p className="truncate text-body">{meal.description}</p>
                    <p className="font-mono text-label text-ash uppercase">
                      {MEAL_TYPE_LABEL[meal.meal_type]} · P {number(Number(meal.protein_g))} · C{' '}
                      {number(Number(meal.carbs_g))} · G {number(Number(meal.fat_g))}
                    </p>
                    {warning ? (
                      // Marca corta por fila; la explicación completa sale al guardar (FormMessage) y en el title.
                      <p className="mt-1 font-mono text-label text-signal-warn uppercase" title={warning}>
                        <span aria-hidden="true">! </span>
                        Kcal y macros no cuadran
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-label">{number(meal.calories_kcal)} kcal</p>
                    <ButtonLink
                      href={`/nutrition?edit=${meal.id}`}
                      scroll={false}
                      tone="quiet"
                      className="h-8 min-w-0 px-0"
                      aria-label={`Editar ${meal.description}`}
                    >
                      Editar
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState actions={<PrefillButton text="200 g de pollo con arroz" />}>
            Sin comidas en los últimos siete días. Escribe lo que has comido en la barra y completa las kcal en el
            borrador; la estimación por foto llegará con la IA.
          </EmptyState>
        )}
      </BrutalistCard>
    </Sheet>
  );
}
