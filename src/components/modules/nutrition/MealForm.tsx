'use client';

import { useState, type ReactNode } from 'react';
import { SelectField, TextField } from '@/components/ui/Field';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { number } from '@/lib/format';
import { saveMeal } from '@/modules/nutrition/actions';
import { MEAL_TYPE_OPTIONS } from '@/modules/nutrition/form';
import { decimal, describeItems, toMealItems, totals, type ComposedItem } from '@/modules/nutrition/items';
import { FoodPicker } from './FoodPicker';

export type MealValues = {
  id?: string;
  mealType: string;
  description: string;
  caloriesKcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  eatenAt: string;
  /** Alimentos del catálogo, para editar una comida que los usaba. */
  items?: ComposedItem[];
};

type Totals = Pick<MealValues, 'caloriesKcal' | 'proteinG' | 'carbsG' | 'fatG'>;

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
  /**
   * «Añadir alimento». Se oculta con un borrador de foto y al editar una comida que estimó la IA: sus
   * alimentos no son del catálogo, y la lista los sustituiría.
   */
  picker?: boolean;
};

const toNumber = (value: FormDataEntryValue | null) => Number(String(value ?? '').replace(',', '.')) || 0;

const EMPTY_TOTALS: Totals = { caloriesKcal: '', proteinG: '', carbsG: '', fatG: '' };

function totalsOf(items: readonly ComposedItem[]): Totals {
  if (items.length === 0) return EMPTY_TOTALS;
  const sum = totals(items);
  return {
    caloriesKcal: String(sum.kcal),
    proteinG: decimal(sum.proteinG),
    carbsG: decimal(sum.carbsG),
    fatG: decimal(sum.fatG),
  };
}

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
  picker = true,
}: MealFormProps) {
  const editing = Boolean(initial?.id);
  const withPicker = picker && !aiMeta;
  // Pista viva: kcal que salen de los macros (Atwater 4/4/9), para contrastar con las escritas.
  const [fromMacros, setFromMacros] = useState<number | null>(null);
  const [items, setItems] = useState<ComposedItem[]>(initial?.items ?? []);
  // La lista cambió en este formulario: solo entonces se envía, para no vaciar la de una comida al editarla.
  const [itemsTouched, setItemsTouched] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? '');
  // Mientras no escribas la descripción, la lista la compone («Pollo, arroz blanco y aceite de oliva»).
  const [ownDescription, setOwnDescription] = useState(Boolean(initial?.description));
  const [values, setValues] = useState<Totals>({
    caloriesKcal: initial?.caloriesKcal ?? '',
    proteinG: initial?.proteinG ?? '',
    carbsG: initial?.carbsG ?? '',
    fatG: initial?.fatG ?? '',
  });

  function changeItems(next: ComposedItem[]) {
    setItems(next);
    setItemsTouched(true);
    setValues(totalsOf(next));
    setFromMacros(null);
    if (!ownDescription) setDescription(describeItems(next));
  }

  const totalField = (name: keyof Totals) => ({
    name,
    value: values[name],
    onChange: (event: { target: { value: string } }) => setValues({ ...values, [name]: event.target.value }),
  });

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
          if (!editing) {
            setItems([]);
            setItemsTouched(false);
            setDescription('');
            setOwnDescription(false);
            setValues(EMPTY_TOTALS);
          }
          onSaved?.(state);
        }}
        secondaryAction={secondaryAction}
        aiMeta={aiMeta}
        className="grid grid-cols-2 gap-4 @lg:grid-cols-4"
      >
        {(errors) => (
          <>
            {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
            {withPicker ? (
              <>
                {itemsTouched || items.length > 0 ? (
                  <input type="hidden" name="items" value={JSON.stringify(toMealItems(items))} />
                ) : null}
                <FoodPicker
                  items={items}
                  onChange={changeItems}
                  suggestedName={ownDescription ? description : ''}
                  surface={surface}
                />
              </>
            ) : null}
            <TextField
              label="Qué has comido"
              name="description"
              autoComplete="off"
              placeholder="Pechuga de pollo con arroz"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                // Si la vacías, la lista vuelve a componerla.
                setOwnDescription(event.target.value.trim() !== '');
              }}
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
              inputMode="numeric"
              autoComplete="off"
              {...totalField('caloriesKcal')}
              error={errors.caloriesKcal}
              hint={
                items.length > 0
                  ? 'Suma de los alimentos.'
                  : fromMacros !== null
                    ? `Según los macros: ${number(fromMacros)} kcal`
                    : undefined
              }
              className="col-span-2 @lg:col-span-1"
              required
            />
            <TextField
              label="Proteína (g)"
              inputMode="decimal"
              autoComplete="off"
              {...totalField('proteinG')}
              error={errors.proteinG}
            />
            <TextField
              label="Carbohidratos (g)"
              inputMode="decimal"
              autoComplete="off"
              {...totalField('carbsG')}
              error={errors.carbsG}
            />
            <TextField
              label="Grasa (g)"
              inputMode="decimal"
              autoComplete="off"
              {...totalField('fatG')}
              error={errors.fatG}
              className="col-span-2 @lg:col-span-2"
            />
          </>
        )}
      </FormShell>
    </div>
  );
}
