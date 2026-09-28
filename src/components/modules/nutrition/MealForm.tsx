'use client';

import { useState, type ReactNode } from 'react';
import { SelectField, TextField } from '@/components/ui/Field';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { number } from '@/lib/format';
import { saveMeal } from '@/modules/nutrition/actions';
import { MEAL_TYPE_OPTIONS } from '@/modules/nutrition/form';

export type MealValues = {
  id?: string;
  mealType: string;
  description: string;
  caloriesKcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  eatenAt: string;
};

type MealFormProps = {
  initial?: Partial<MealValues>;
  defaultEatenAt: string;
  defaultMealType: string;
  surface?: 'folder' | 'paper';
  submitLabel?: string;
  doneHref?: string;
  onSaved?: (state: Saved) => void;
  secondaryAction?: ReactNode;
  /** Metadato del borrador de IA (origen, archivo, confianza), en JSON. */
  aiMeta?: string;
};

const toNumber = (value: FormDataEntryValue | null) => Number(String(value ?? '').replace(',', '.')) || 0;

export function MealForm({
  initial,
  defaultEatenAt,
  defaultMealType,
  surface,
  submitLabel,
  doneHref,
  onSaved,
  secondaryAction,
  aiMeta,
}: MealFormProps) {
  const editing = Boolean(initial?.id);
  // Pista viva: kcal que salen de los macros (Atwater 4/4/9), para contrastar con las escritas.
  const [fromMacros, setFromMacros] = useState<number | null>(null);

  return (
    <div
      onInput={(event) => {
        const form = (event.target as HTMLElement).closest('form');
        if (!form) return;
        const data = new FormData(form);
        const kcal =
          4 * toNumber(data.get('proteinG')) + 4 * toNumber(data.get('carbsG')) + 9 * toNumber(data.get('fatG'));
        setFromMacros(kcal > 0 ? Math.round(kcal) : null);
      }}
    >
      <FormShell
        action={saveMeal}
        submitLabel={submitLabel ?? (editing ? 'Guardar cambios' : 'Guardar comida')}
        surface={surface}
        resetOnSuccess={!editing && !onSaved}
        doneHref={doneHref}
        onSaved={(state) => {
          setFromMacros(null);
          onSaved?.(state);
        }}
        secondaryAction={secondaryAction}
        aiMeta={aiMeta}
        className="grid grid-cols-2 gap-4 @lg:grid-cols-4"
      >
        {(errors) => (
          <>
            {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
            <TextField
              label="Qué has comido"
              name="description"
              autoComplete="off"
              placeholder="Pechuga de pollo con arroz"
              defaultValue={initial?.description ?? ''}
              error={errors.description}
              className="col-span-2 @lg:col-span-4"
              required
            />
            <SelectField
              label="Tipo"
              name="mealType"
              options={MEAL_TYPE_OPTIONS}
              defaultValue={initial?.mealType ?? defaultMealType}
              error={errors.mealType}
              className="col-span-2 @lg:col-span-1"
            />
            <TextField
              label="Fecha y hora"
              name="eatenAt"
              type="datetime-local"
              defaultValue={initial?.eatenAt ?? defaultEatenAt}
              error={errors.eatenAt}
              className="col-span-2 @lg:col-span-2"
              required
            />
            <TextField
              label="Kcal"
              name="caloriesKcal"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={initial?.caloriesKcal ?? ''}
              error={errors.caloriesKcal}
              hint={fromMacros !== null ? `Según los macros: ${number(fromMacros)} kcal` : undefined}
              className="col-span-2 @lg:col-span-1"
              required
            />
            <TextField
              label="Proteína (g)"
              name="proteinG"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={initial?.proteinG ?? ''}
              error={errors.proteinG}
            />
            <TextField
              label="Carbohidratos (g)"
              name="carbsG"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={initial?.carbsG ?? ''}
              error={errors.carbsG}
            />
            <TextField
              label="Grasa (g)"
              name="fatG"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={initial?.fatG ?? ''}
              error={errors.fatG}
              className="col-span-2 @lg:col-span-2"
            />
          </>
        )}
      </FormShell>
    </div>
  );
}
