-- =============================================================================
-- FOLIO · catálogo de alimentos y platos guardados (05 // NUTRICIÓN)
-- supabase/migrations/20260929000000_foods.sql
-- Los datos de `foods` los carga la migración siguiente, generada desde supabase/data/.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0 · Búsqueda tolerante a erratas
-- -----------------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;

-- Forma de búsqueda: minúsculas y sin tildes («Plátano» → «platano»). unaccent no es IMMUTABLE
-- porque el diccionario podría cambiar; con el diccionario fijado, el resultado sí lo es, y la
-- función puede usarse en columnas generadas e índices.
create or replace function private.search_text(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, value));
$$;


-- -----------------------------------------------------------------------------
-- 1 · Tablas
-- -----------------------------------------------------------------------------

-- Catálogo común a todas las cuentas: CIQUAL 2025 (Anses, Licence Ouverte 2.0), traducido.
-- Valores por 100 g. Solo lectura: se carga y se corrige con migraciones, nunca con sesión.
create table public.foods (
  id              integer primary key,  -- código CIQUAL (alim_code): estable entre entornos
  name            text not null unique check (char_length(name) between 1 and 200),
  category        text not null check (char_length(category) between 1 and 80),
  kcal            numeric(6,2) not null check (kcal between 0 and 900),
  protein_g       numeric(6,2) not null check (protein_g between 0 and 100),
  carbs_g         numeric(6,2) not null check (carbs_g between 0 and 100),
  fat_g           numeric(6,2) not null check (fat_g between 0 and 100),
  -- Términos de búsqueda que no se muestran: nombres de uso común que CIQUAL no recoge
  -- («macarrones» en la pasta, «jamón york» en el jamón cocido).
  aliases         text not null default '' check (char_length(aliases) <= 200),
  search_name     text generated always as (private.search_text(name)) stored,
  search_aliases  text generated always as (private.search_text(aliases)) stored
);

-- Platos guardados: recetas propias hechas con alimentos del catálogo. La fila es la receta
-- entera; `servings` dice en cuántas raciones se reparte.
create table public.dishes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  servings    smallint not null default 1 check (servings between 1 and 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);

create table public.dish_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dish_id     uuid not null,
  food_id     integer not null references public.foods (id),
  grams       numeric(6,1) not null check (grams > 0 and grams <= 5000),
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  foreign key (dish_id, user_id) references public.dishes (id, user_id) on delete cascade,
  unique (dish_id, food_id)
);


-- -----------------------------------------------------------------------------
-- 2 · Índices
-- `foods` no lleva índice de trigramas: la búsqueda recorre 3.181 filas en milisegundos.
-- -----------------------------------------------------------------------------
-- Dos platos de la misma cuenta no se llaman igual, ni cambiando mayúsculas o tildes.
create unique index dishes_user_name_key  on public.dishes (user_id, private.search_text(name));
create index dish_items_dish_idx          on public.dish_items (dish_id);
create index dish_items_food_idx          on public.dish_items (food_id);

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function private.set_updated_at();


-- -----------------------------------------------------------------------------
-- 3 · Funciones: autocompletado de «Qué has comido» y guardar un plato
-- Platos propios (RLS los limita a los de quien llama) y alimentos del catálogo.
-- Cada palabra de la consulta, sin artículos ni preposiciones, tiene que aparecer en el nombre
-- o en los alias. Si tiene 4 letras o más, también vale con una errata («pechga» encuentra
-- «pechuga»: word_similarity ≥ 0,5); con menos, «pan» encontraría «papaya».
-- El plural cuenta como el singular: se quita la -s o -es final («lentejas» encuentra
-- «Lenteja»), y como lo que queda es un prefijo de la palabra, nunca se pierde una coincidencia.
-- Orden: los platos; lo que coincide sin erratas; lo que solo coincide gracias a un alias,
-- elegido a mano («espaguetis» es la pasta antes que el alga «Espagueti de mar»); lo que
-- empieza por la primera palabra; y el nombre más parecido a la consulta entera.
-- Los valores son para `grams` gramos: 100 en un alimento, una ración en un plato.
-- -----------------------------------------------------------------------------
create or replace function public.search_foods(p_query text, p_limit integer default 12)
returns table (
  kind       text,
  food_id    integer,
  dish_id    uuid,
  name       text,
  category   text,
  grams      numeric,
  kcal       numeric,
  protein_g  numeric,
  carbs_g    numeric,
  fat_g      numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  -- La misma normalización que private.search_text, escrita aquí porque la función se ejecuta
  -- con la sesión de quien llama y el esquema private no le es accesible.
  with normalized as (
    select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_query, ''))) as full_text
  ),
  q as (
    select src.full_text,
           array(
             select case when char_length(t.word) > 3 then regexp_replace(t.word, '(es|s)$', '') else t.word end
             from regexp_split_to_table(src.full_text, '[^a-z0-9]+') with ordinality as t (word, n)
             where char_length(t.word) >= 2
               and t.word <> all (array['de', 'del', 'el', 'la', 'los', 'las', 'un', 'una', 'al', 'en', 'y'])
             order by t.n
           ) as words
    from normalized src
  ),
  dish_totals as (
    select d.id,
           d.name,
           d.servings,
           sum(i.grams) as grams,
           sum(f.kcal * i.grams / 100) as kcal,
           sum(f.protein_g * i.grams / 100) as protein_g,
           sum(f.carbs_g * i.grams / 100) as carbs_g,
           sum(f.fat_g * i.grams / 100) as fat_g
    from public.dishes d
    join public.dish_items i on i.dish_id = d.id and i.user_id = d.user_id
    join public.foods f on f.id = i.food_id
    group by d.id
  ),
  candidates as (
    select 'dish'::text as kind,
           null::integer as food_id,
           t.id as dish_id,
           t.name,
           'Plato guardado'::text as category,
           round(t.grams / t.servings, 0) as grams,
           round(t.kcal / t.servings, 0) as kcal,
           round(t.protein_g / t.servings, 1) as protein_g,
           round(t.carbs_g / t.servings, 1) as carbs_g,
           round(t.fat_g / t.servings, 1) as fat_g,
           lower(extensions.unaccent('extensions.unaccent'::regdictionary, t.name)) as search_name,
           ''::text as search_aliases
    from dish_totals t
    union all
    select 'food', f.id, null, f.name, f.category, 100, f.kcal, f.protein_g, f.carbs_g, f.fat_g,
           f.search_name, f.search_aliases
    from public.foods f
  )
  select c.kind, c.food_id, c.dish_id, c.name, c.category, c.grams, c.kcal, c.protein_g, c.carbs_g, c.fat_g
  from candidates c
  cross join q
  where cardinality(q.words) > 0
    and not exists (
      select 1
      from unnest(q.words) as w
      where c.search_name not like '%' || w || '%'
        and c.search_aliases not like '%' || w || '%'
        and (char_length(w) < 4 or extensions.word_similarity(w, c.search_name) < 0.5)
    )
  order by
    (c.kind = 'dish') desc,
    (select count(*) from unnest(q.words) as w
      where c.search_name like '%' || w || '%' or c.search_aliases like '%' || w || '%') desc,
    exists (select 1 from unnest(q.words) as w
            where c.search_aliases like '%' || w || '%' and c.search_name not like '%' || w || '%') desc,
    (c.search_name like q.words[1] || '%') desc,
    extensions.similarity(q.full_text, c.search_name) desc,
    char_length(c.name),
    c.name
  limit least(greatest(coalesce(p_limit, 12), 1), 25);
$$;


-- Guardar un plato: la receta y sus ingredientes, todo o nada. SECURITY INVOKER: user_id sale
-- de auth.uid() por defecto y RLS aplica. Un nombre repetido (23505) o un alimento que no existe
-- (23503) deshacen también el plato.
create or replace function public.create_dish(p_name text, p_servings integer, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 40 then
    raise exception 'Un plato lleva entre 1 y 40 ingredientes' using errcode = '23514';
  end if;

  insert into public.dishes (name, servings) values (trim(p_name), p_servings) returning id into v_id;

  insert into public.dish_items (dish_id, food_id, grams, sort_order)
  select v_id, (e.item ->> 'food_id')::integer, (e.item ->> 'grams')::numeric, (e.n - 1)::smallint
  from jsonb_array_elements(p_items) with ordinality as e (item, n);

  return v_id;
end;
$$;


-- -----------------------------------------------------------------------------
-- 4 · Row Level Security
-- -----------------------------------------------------------------------------
-- Catálogo: lo lee cualquier sesión; nadie lo escribe (§5 retira los privilegios).
alter table public.foods enable row level security;
create policy foods_select_all on public.foods
  for select to authenticated using (true);

-- Platos: CRUD completo sobre las filas propias, como las demás tablas de dominio.
do $$
declare
  t text;
begin
  foreach t in array array['dishes', 'dish_items']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end
$$;


-- -----------------------------------------------------------------------------
-- 5 · Privilegios
-- Las tablas y funciones nuevas reciben los privilegios por defecto de Supabase, también para
-- anon: se retiran como en la migración inicial.
-- -----------------------------------------------------------------------------
revoke all on public.foods, public.dishes, public.dish_items from anon;
revoke all on public.foods from authenticated;
grant select on public.foods to authenticated;

revoke execute on function public.search_foods(text, integer), public.create_dish(text, integer, jsonb) from public, anon;
grant execute on function public.search_foods(text, integer), public.create_dish(text, integer, jsonb)
  to authenticated, service_role;
