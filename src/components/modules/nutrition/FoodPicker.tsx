'use client';

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CONTROL, Field } from '@/components/ui/Field';
import { FormMessage } from '@/components/ui/FormControls';
import { Icon } from '@/components/ui/Icon';
import type { FormState } from '@/lib/action-result';
import { number } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { saveDish } from '@/modules/nutrition/actions';
import {
  dishIngredients,
  itemValues,
  matchFromRow,
  type ComposedItem,
  type FoodMatch,
} from '@/modules/nutrition/items';

const MIN_QUERY = 2;
const DEBOUNCE_MS = 150;
const RESULTS = 8;

type Search = { query: string; results: FoodMatch[]; failed: boolean };

/**
 * Búsqueda en el catálogo y en los platos propios. Va directa a Supabase desde el navegador: una Server
 * Action se despacharía en cola, una tras otra, y el autocompletado lanza una consulta por pausa al
 * escribir. RLS se aplica igual (la sesión es la misma).
 */
async function searchFoods(query: string, limit = RESULTS) {
  const { data, error } = await createClient().rpc('search_foods', { p_query: query, p_limit: limit });
  return { results: error ? [] : data.flatMap((row) => matchFromRow(row) ?? []), failed: Boolean(error) };
}

/** Resultados de lo escrito, tras una pausa. Nunca se muestran los de una consulta anterior. */
function useFoodSearch(query: string) {
  const [search, setSearch] = useState<Search>({ query: '', results: [], failed: false });
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return;
    let stale = false;
    const timer = setTimeout(async () => {
      const found = await searchFoods(trimmed);
      if (!stale) setSearch({ query: trimmed, ...found });
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  if (trimmed.length < MIN_QUERY) return { status: 'idle' as const, results: [] };
  if (search.query !== trimmed) return { status: 'loading' as const, results: [] };
  return { status: search.failed ? ('error' as const) : ('done' as const), results: search.results };
}

function matchMeta(match: FoodMatch): string {
  return match.kind === 'food'
    ? `${match.category} · ${number(match.per.kcal)} kcal/100 g`
    : `Plato · ${number(match.per.kcal)} kcal por ración de ${number(match.servingGrams)} g`;
}

type Surface = 'folder' | 'paper';

type FoodPickerProps = {
  items: ComposedItem[];
  onChange: (items: ComposedItem[]) => void;
  /** Nombre que se propone al guardar la lista como plato (la descripción, si la has escrito). */
  suggestedName: string;
  surface?: Surface;
};

/** «Añadir alimento»: busca, añade filas con su cantidad y guarda la lista como plato propio. */
export function FoodPicker({ items, onChange, suggestedName, surface = 'folder' }: FoodPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [notice, setNotice] = useState<FormState>({ status: 'idle' });
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  // Tras añadir una fila, el foco va a su cantidad (lo siguiente que se escribe son los gramos): lo hace el
  // ref de la fila al montarse.
  const focusNext = useRef<string | null>(null);
  const added = useRef(0);
  const listId = useId();
  const { status, results } = useFoodSearch(query);
  const expanded = open && status !== 'idle';

  function pick(match: FoodMatch) {
    added.current += 1;
    const key = `${match.kind}-${match.kind === 'food' ? match.foodId : match.dishId}-${added.current}`;
    focusNext.current = key;
    onChange([...items, { ...match, key, amount: match.kind === 'food' ? '100' : '1' }]);
    setNotice({ status: 'idle' });
    setQuery('');
    setOpen(false);
    setActive(-1);
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    const count = results.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (count === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + count) % count);
    } else if (event.key === 'Enter') {
      // Intro en la búsqueda nunca envía la comida: elige la opción activa, o la primera. Si los resultados
      // aún no han llegado (escribir rápido y pulsar Intro), busca ya y añade el primero.
      event.preventDefault();
      const match = results[active] ?? results[0];
      if (status === 'done' && match) pick(match);
      else if (status === 'loading') {
        const typed = query.trim();
        void searchFoods(typed, 1).then(({ results: [first] }) => {
          if (first && searchRef.current?.value.trim() === typed) pick(first);
        });
      }
    } else if (event.key === 'Escape' && (expanded || query)) {
      // Dentro de un borrador, Escape lo descartaría: aquí primero cierra la lista y luego vacía el campo.
      event.stopPropagation();
      if (expanded) setOpen(false);
      else setQuery('');
    }
  }

  const announcement =
    status === 'done'
      ? results.length === 0
        ? 'Sin resultados.'
        : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}. Flechas para elegir, Intro para añadir.`
      : status === 'error'
        ? 'No se ha podido buscar.'
        : '';

  return (
    <div className="col-span-full flex flex-col gap-3">
      <Field
        label="Añadir alimento"
        name="food-search"
        hint="Alimentos genéricos de CIQUAL (Anses) y tus platos guardados."
      >
        {(control) => (
          <div className="relative">
            <input
              {...control}
              ref={searchRef}
              type="text"
              role="combobox"
              aria-expanded={expanded}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Arroz, pechuga de pollo, lentejas…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={() => setOpen(true)}
              // En pantallas táctiles, tocar una opción le da el foco (tabIndex −1) antes del clic: no se cierra.
              onBlur={(event) => {
                if (!optionsRef.current?.contains(event.relatedTarget)) setOpen(false);
              }}
              onKeyDown={onSearchKey}
              className={`${CONTROL} h-11`}
            />
            {expanded ? (
              <div ref={optionsRef} className="food-options absolute inset-x-0 top-full z-20 mt-1 shadow-hard">
                <ul id={listId} role="listbox" aria-label="Resultados" className="max-h-80 overflow-y-auto">
                  {results.map((match, index) => (
                    <li
                      key={match.kind === 'food' ? `f${match.foodId}` : `d${match.dishId}`}
                      id={`${listId}-${index}`}
                      role="option"
                      tabIndex={-1}
                      aria-selected={index === active}
                      // mousedown: el campo no pierde el foco antes del clic.
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseMove={() => setActive(index)}
                      onClick={() => pick(match)}
                      className="food-option flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2"
                    >
                      <span className="text-body">{match.name}</span>
                      <span className="field-hint font-mono text-label uppercase">{matchMeta(match)}</span>
                    </li>
                  ))}
                </ul>
                {status === 'loading' && results.length === 0 ? (
                  <p className="field-hint px-3 py-3 text-small">Buscando…</p>
                ) : null}
                {status === 'done' && results.length === 0 ? (
                  <p className="field-hint px-3 py-3 text-small">
                    Sin resultados. Prueba con otra palabra o escribe las kcal a mano.
                  </p>
                ) : null}
                {status === 'error' ? (
                  <p className="field-error px-3 py-3 text-small">No se ha podido buscar. Revisa la conexión.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </Field>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {items.length > 0 ? (
        <ul aria-label="Alimentos de la comida" className="food-rows">
          {items.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              inputRef={(element) => {
                if (element && focusNext.current === item.key) {
                  focusNext.current = null;
                  element.select();
                }
              }}
              onAmount={(amount) =>
                onChange(items.map((current) => (current.key === item.key ? { ...current, amount } : current)))
              }
              onRemove={() => {
                onChange(items.filter((current) => current.key !== item.key));
                searchRef.current?.focus();
              }}
              onDone={() => searchRef.current?.focus()}
              surface={surface}
            />
          ))}
        </ul>
      ) : null}

      {items.length > 0 && items.every((item) => item.kind === 'food') ? (
        <SaveAsDish
          items={items}
          suggestedName={suggestedName}
          surface={surface}
          onSaved={(dish, message) => {
            onChange([{ ...dish, key: `dish-${dish.dishId}`, amount: '1' }]);
            setNotice({ status: 'success', message });
          }}
        />
      ) : null}
      {/* Al guardar la comida la lista se vacía, y el aviso del plato ya no viene a cuento. */}
      {notice.status === 'success' && items.length > 0 ? <FormMessage state={notice} /> : null}
    </div>
  );
}

function ItemRow({
  item,
  inputRef,
  onAmount,
  onRemove,
  onDone,
  surface,
}: {
  item: ComposedItem;
  inputRef: (element: HTMLInputElement | null) => void;
  onAmount: (amount: string) => void;
  onRemove: () => void;
  onDone: () => void;
  surface: Surface;
}) {
  const values = itemValues(item);
  const unit = item.kind === 'food' ? 'g' : 'rac.';
  return (
    // En una ficha estrecha (móvil), los valores bajan a su propia fila a todo el ancho; en una ancha, van
    // bajo el nombre y la cantidad ocupa las dos filas.
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 py-2">
      <p className="min-w-0 text-body">{item.name}</p>
      <label className="flex items-center gap-2 @md:row-span-2">
        <span className="sr-only">
          {item.kind === 'food' ? 'Gramos' : 'Raciones'} de {item.name}
        </span>
        <input
          ref={inputRef}
          inputMode="decimal"
          autoComplete="off"
          value={item.amount}
          onChange={(event) => onAmount(event.target.value)}
          onKeyDown={(event) => {
            // Intro confirma la cantidad y vuelve a la búsqueda para añadir otro alimento; no envía la comida.
            if (event.key === 'Enter') {
              event.preventDefault();
              onDone();
            }
          }}
          className="control h-11 w-20 px-3 text-right text-body"
        />
        <span aria-hidden="true" className="w-8 font-mono text-label uppercase">
          {unit}
        </span>
      </label>
      <Button
        tone="quiet"
        surface={surface}
        onClick={onRemove}
        aria-label={`Quitar ${item.name}`}
        className="px-0 @md:row-span-2"
      >
        <Icon name="close" />
      </Button>
      <p className="field-hint col-span-full font-mono text-label uppercase @md:col-span-1">
        {number(values.kcal)} kcal · P {number(values.proteinG, 1)} · C {number(values.carbsG, 1)} · G{' '}
        {number(values.fatG, 1)}
        {item.kind === 'dish' ? ` · ${number(values.grams)} g` : ''}
      </p>
    </li>
  );
}

function SaveAsDish({
  items,
  suggestedName,
  surface,
  onSaved,
}: {
  items: ComposedItem[];
  suggestedName: string;
  surface: Surface;
  onSaved: (dish: Extract<FoodMatch, { kind: 'dish' }>, message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [error, setError] = useState<FormState>({ status: 'idle' });
  const [pending, startTransition] = useTransition();
  const nameId = useId();
  const servingsId = useId();

  function save() {
    startTransition(async () => {
      const state = await saveDish({
        name,
        servings: Number(servings.trim().replace(',', '.')),
        items: dishIngredients(items),
      });
      if (state.status === 'success') {
        setEditing(false);
        onSaved(state.dish, state.message);
      } else {
        const detail = state.fieldErrors?.name ?? state.fieldErrors?.servings ?? state.fieldErrors?.items;
        setError({ status: 'error', message: detail ? `${state.message} ${detail}` : state.message });
      }
    });
  }

  if (!editing) {
    return (
      <div>
        <Button
          tone="secondary"
          surface={surface}
          onClick={() => {
            setEditing(true);
            setName(suggestedName);
            setError({ status: 'idle' });
          }}
        >
          Guardar como plato
        </Button>
      </div>
    );
  }

  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    // Dentro del formulario de la comida: Intro guarda el plato, no la comida.
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      setEditing(false);
    }
  };

  return (
    <fieldset className="food-dish grid grid-cols-[minmax(0,1fr)_6rem] gap-3 p-3">
      <legend className="field-label px-1 font-mono text-label uppercase">Guardar como plato</legend>
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={nameId} className="field-label font-mono text-label uppercase">
          Nombre del plato
        </label>
        <input
          id={nameId}
          autoFocus
          autoComplete="off"
          maxLength={120}
          placeholder="Lentejas de casa"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={onEnter}
          aria-invalid={error.status === 'error' ? true : undefined}
          className={`${CONTROL} h-11`}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={servingsId} className="field-label font-mono text-label uppercase">
          Raciones
        </label>
        <input
          id={servingsId}
          inputMode="numeric"
          autoComplete="off"
          value={servings}
          onChange={(event) => setServings(event.target.value)}
          onKeyDown={onEnter}
          className={`${CONTROL} h-11 text-right`}
        />
      </div>
      <p className="field-hint col-span-full text-small">
        Si la lista es para varias raciones, la comida pasa a ser una ración del plato.
      </p>
      <div className="col-span-full flex flex-wrap items-center gap-3">
        <Button tone="secondary" surface={surface} onClick={save} disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar plato'}
        </Button>
        <Button tone="quiet" surface={surface} onClick={() => setEditing(false)}>
          Cancelar
        </Button>
        <FormMessage state={error} />
      </div>
    </fieldset>
  );
}
