-- =============================================================================
-- DOSSIER_OS · migración inicial
-- supabase/migrations/20260928000000_init.sql
-- Ejecutable en Supabase (CLI: `supabase db push`, o pegado en el SQL Editor).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0 · Extensiones, esquemas y búsqueda en español
-- -----------------------------------------------------------------------------
create extension if not exists vector with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Funciones internas (triggers, validaciones): fuera de `public`, el esquema que expone la API.
create schema if not exists private;

-- Texto completo en español e insensible a tildes: «camion» encuentra «camión».
create text search configuration public.spanish_unaccent (copy = pg_catalog.spanish);
alter text search configuration public.spanish_unaccent
  alter mapping for hword, hword_part, word with extensions.unaccent, spanish_stem;


-- -----------------------------------------------------------------------------
-- 1 · Tipos (se reflejan tal cual en los tipos TypeScript generados)
-- -----------------------------------------------------------------------------
create type public.transaction_kind as enum ('expense', 'income');
create type public.transaction_category as enum (
  'groceries', 'restaurants', 'transport', 'housing', 'utilities', 'health', 'sport',
  'leisure', 'shopping', 'subscriptions', 'education', 'travel', 'gifts', 'taxes',
  'salary', 'other'
);
create type public.payment_method as enum ('card', 'cash', 'transfer', 'bizum', 'other');
create type public.entry_source as enum ('manual', 'ocr', 'photo', 'voice', 'import');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.media_kind as enum ('book', 'film', 'series', 'podcast', 'game', 'album');
create type public.media_status as enum ('backlog', 'in_progress', 'done', 'dropped');
create type public.habit_cadence as enum ('daily', 'weekly');
create type public.ai_task as enum (
  'receipt_extraction', 'meal_extraction', 'voice_transcription', 'voice_structuring',
  'embedding', 'chat', 'briefing'
);
create type public.ai_run_status as enum ('ok', 'error', 'rejected');


-- -----------------------------------------------------------------------------
-- 2 · Funciones auxiliares
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;


-- -----------------------------------------------------------------------------
-- 3 · Tablas
-- Convenciones:
--   · `user_id` con valor por defecto auth.uid(): el cliente nunca lo envía.
--   · Dinero en numeric(12,2), nunca float.
--   · Instantes en timestamptz; días de calendario en date, calculados en la zona del usuario.
--   · Las tablas hijas llevan FK compuesta (padre_id, user_id): impide colgar filas propias
--     de un padre ajeno, porque las comprobaciones de FK no pasan por RLS.
-- -----------------------------------------------------------------------------

-- 08 // SETTINGS -------------------------------------------------------------
create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  display_name            text check (char_length(display_name) <= 80),
  timezone                text not null default 'Europe/Madrid' check (private.is_valid_timezone(timezone)),
  currency                char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  daily_kcal_target       integer check (daily_kcal_target between 800 and 8000),
  daily_protein_g_target  integer check (daily_protein_g_target between 0 and 500),
  daily_carbs_g_target    integer check (daily_carbs_g_target between 0 and 1000),
  daily_fat_g_target      integer check (daily_fat_g_target between 0 and 400),
  monthly_budget          numeric(12,2) check (monthly_budget >= 0),
  briefing_enabled        boolean not null default true,
  ai_monthly_budget_usd   numeric(8,2) not null default 25 check (ai_monthly_budget_usd between 0 and 1000),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 02 // GYM ------------------------------------------------------------------
create table public.workouts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title             text not null check (char_length(title) between 1 and 80),
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  perceived_effort  smallint check (perceived_effort between 1 and 10),
  notes             text check (char_length(notes) <= 2000),
  source            public.entry_source not null default 'manual',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, user_id),
  check (ended_at is null or ended_at >= started_at)
);

create table public.workout_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_id  uuid not null,
  exercise    text not null check (char_length(exercise) between 1 and 80),
  set_index   smallint not null check (set_index between 1 and 50),
  reps        smallint not null check (reps between 0 and 200),
  weight_kg   numeric(6,2) not null default 0 check (weight_kg between 0 and 1000),
  rpe         numeric(3,1) check (rpe between 1 and 10),
  is_warmup   boolean not null default false,
  created_at  timestamptz not null default now(),
  foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade,
  unique (workout_id, exercise, set_index)
);

-- 03 // VAULT ----------------------------------------------------------------
create table public.financial_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind            public.transaction_kind not null default 'expense',
  amount          numeric(12,2) not null check (amount > 0),
  currency        char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  category        public.transaction_category not null default 'other',
  merchant        text check (char_length(merchant) <= 120),
  description     text check (char_length(description) <= 500),
  payment_method  public.payment_method,
  occurred_at     timestamptz not null default now(),
  tax_amount      numeric(12,2) check (tax_amount >= 0),
  -- [{ "ratePct": 21, "base": 10.33, "amount": 2.17 }, …]: un ticket español puede mezclar tipos
  tax_breakdown   jsonb check (tax_breakdown is null or jsonb_typeof(tax_breakdown) = 'array'),
  receipt_path    text check (receipt_path is null or split_part(receipt_path, '/', 1) = user_id::text),
  source          public.entry_source not null default 'manual',
  ai_confidence   numeric(3,2) check (ai_confidence between 0 and 1),
  raw_extraction  jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 04 // BRAIN ----------------------------------------------------------------
create table public.notes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date        date not null,
  title             text check (char_length(title) <= 160),
  content           text not null check (char_length(content) between 1 and 20000),
  mood              smallint check (mood between 1 and 5),
  tags              text[] not null default '{}' check (cardinality(tags) <= 20),
  source            public.entry_source not null default 'manual',
  audio_path        text check (audio_path is null or split_part(audio_path, '/', 1) = user_id::text),
  audio_duration_s  integer check (audio_duration_s between 0 and 600),
  -- La genera Postgres: nunca se desincroniza del texto.
  fts               tsvector generated always as (
                      to_tsvector('public.spanish_unaccent'::regconfig, coalesce(title, '') || ' ' || content)
                    ) stored,
  -- 1536 = text-embedding-3-small. HNSW indexa `vector` hasta 2000 dimensiones.
  embedding         extensions.vector(1536),
  embedding_model   text,
  embedded_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 05 // NUTRITION ------------------------------------------------------------
create table public.macros (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_at        timestamptz not null default now(),
  meal_type       public.meal_type not null,
  description     text not null check (char_length(description) between 1 and 300),
  -- [{ "name": "arroz", "grams": 150, "caloriesKcal": 195, … }]
  items           jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  calories_kcal   integer not null check (calories_kcal between 0 and 10000),
  protein_g       numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g         numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g           numeric(6,1) not null default 0 check (fat_g >= 0),
  photo_path      text check (photo_path is null or split_part(photo_path, '/', 1) = user_id::text),
  source          public.entry_source not null default 'manual',
  ai_confidence   numeric(3,2) check (ai_confidence between 0 and 1),
  raw_extraction  jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 06 // MEDIA ----------------------------------------------------------------
create table public.media_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind          public.media_kind not null,
  title         text not null check (char_length(title) between 1 and 200),
  creator       text check (char_length(creator) <= 200),
  status        public.media_status not null default 'backlog',
  rating        smallint check (rating between 1 and 10),
  progress_pct  smallint check (progress_pct between 0 and 100),
  started_on    date,
  finished_on   date,
  review        text check (char_length(review) <= 5000),
  cover_url     text check (cover_url ~ '^https://'),
  external_ref  jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (finished_on is null or started_on is null or finished_on >= started_on)
);

-- 07 // ROUTINE --------------------------------------------------------------
create table public.habits (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 60),
  cadence            public.habit_cadence not null default 'daily',
  target_per_period  smallint not null default 1 check (target_per_period between 1 and 14),
  sort_order         smallint not null default 0,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, user_id)
);

create table public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id    uuid not null,
  -- Día LOCAL del usuario, calculado en la app con profiles.timezone (nunca current_date, que es UTC).
  logged_on   date not null,
  times       smallint not null default 1 check (times between 1 and 50),
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now(),
  foreign key (habit_id, user_id) references public.habits (id, user_id) on delete cascade,
  unique (habit_id, logged_on)
);

create table public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label            text check (char_length(label) <= 80),
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  planned_minutes  smallint not null default 25 check (planned_minutes between 1 and 240),
  interruptions    smallint not null default 0 check (interruptions between 0 and 100),
  duration_s       integer generated always as (
                     case when ended_at is null then null
                          else extract(epoch from (ended_at - started_at))::integer end
                   ) stored,
  created_at       timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at)
);

-- 01 // HOME · salida del agente programado ----------------------------------
create table public.daily_briefings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  briefing_date  date not null,
  content        jsonb not null,               -- BriefingSchema validado
  metrics        jsonb not null,               -- instantánea de métricas: la fuente de TODAS las cifras
  model          text not null,
  read_at        timestamptz,
  feedback       jsonb not null default '{}',  -- { "<insightId>": "up" | "down" }
  created_at     timestamptz not null default now(),
  unique (user_id, briefing_date)              -- idempotencia: reejecutar el cron no duplica
);

-- Observabilidad y presupuesto de IA ------------------------------------------
create table public.ai_runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task           public.ai_task not null,
  model          text not null,
  status         public.ai_run_status not null,
  input_tokens   integer not null default 0 check (input_tokens >= 0),
  output_tokens  integer not null default 0 check (output_tokens >= 0),
  latency_ms     integer not null check (latency_ms >= 0),
  cost_usd       numeric(10,6) not null default 0 check (cost_usd >= 0),
  subject_table  text,
  subject_id     uuid,
  error_code     text,
  created_at     timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 4 · Índices (todas las políticas filtran por user_id: todos empiezan por él)
-- -----------------------------------------------------------------------------
create index workouts_user_started_idx               on public.workouts (user_id, started_at desc);
create index workout_logs_workout_idx                on public.workout_logs (workout_id);
create index workout_logs_user_exercise_idx          on public.workout_logs (user_id, lower(exercise), created_at desc);
create index financial_transactions_user_time_idx    on public.financial_transactions (user_id, occurred_at desc);
create index financial_transactions_user_cat_idx     on public.financial_transactions (user_id, category, occurred_at desc);
create index notes_user_entry_date_idx               on public.notes (user_id, entry_date desc);
create index notes_fts_idx                           on public.notes using gin (fts);
create index notes_tags_idx                          on public.notes using gin (tags);
create index notes_pending_embedding_idx             on public.notes (user_id) where embedding is null;
-- HNSW frente a IVFFlat: no necesita datos previos para entrenarse, mejor recall a igual
-- latencia y se mantiene solo con inserciones. Coseno: robusto aunque el modelo no normalice.
create index notes_embedding_hnsw_idx                on public.notes
  using hnsw (embedding extensions.vector_cosine_ops) with (m = 16, ef_construction = 64);
create index macros_user_eaten_idx                   on public.macros (user_id, eaten_at desc);
create index media_items_user_status_idx             on public.media_items (user_id, status, updated_at desc);
create index media_items_user_finished_idx           on public.media_items (user_id, finished_on desc) where status = 'done';
create index habits_user_active_idx                  on public.habits (user_id, sort_order) where archived_at is null;
create index habit_logs_user_logged_idx              on public.habit_logs (user_id, logged_on desc);
create index focus_sessions_user_started_idx         on public.focus_sessions (user_id, started_at desc);
create index daily_briefings_user_date_idx           on public.daily_briefings (user_id, briefing_date desc);
create index ai_runs_user_created_idx                on public.ai_runs (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 5 · Triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'workouts', 'financial_transactions', 'macros', 'media_items', 'habits']
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end
$$;

-- Notas: si cambia el texto, el embedding anterior deja de representarlo y se invalida.
-- Escribir el embedding no cuenta como edición: no toca updated_at.
create or replace function private.notes_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.title is distinct from old.title or new.content is distinct from old.content then
    new.embedding := null;
    new.embedding_model := null;
    new.embedded_at := null;
  end if;

  if new.title is distinct from old.title
     or new.content is distinct from old.content
     or new.mood is distinct from old.mood
     or new.tags is distinct from old.tags
     or new.entry_date is distinct from old.entry_date then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

create trigger notes_before_update
  before update on public.notes
  for each row execute function private.notes_before_update();

-- Perfil automático al registrarse.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();


-- -----------------------------------------------------------------------------
-- 6 · Funciones RPC: las «herramientas» del agente
-- Todas son SECURITY INVOKER: se ejecutan con la sesión de quien llama, así que RLS aplica.
-- `p_user_id` solo tiene efecto con la clave secreta (job programado, que salta RLS);
-- con la sesión de un usuario, RLS ya limita las filas a las suyas.
-- -----------------------------------------------------------------------------

-- Búsqueda híbrida (texto completo + vectorial) fusionada con Reciprocal Rank Fusion.
create or replace function public.hybrid_search_notes(
  query_text        text,
  query_embedding   extensions.vector(1536),
  match_count       integer default 8,
  date_from         date default null,
  date_to           date default null,
  full_text_weight  double precision default 1,
  semantic_weight   double precision default 1,
  rrf_k             integer default 50
)
returns table (
  id          uuid,
  entry_date  date,
  title       text,
  excerpt     text,
  tags        text[],
  score       double precision
)
language plpgsql
security invoker
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  -- pgvector >= 0.8: sigue recorriendo el grafo HNSW hasta reunir filas que pasen el filtro
  -- (RLS + fechas). Sin esto, con varios usuarios, la búsqueda puede devolver de menos.
  perform set_config('hnsw.iterative_scan', 'relaxed_order', true);

  return query
  with full_text as (
    select n.id,
           row_number() over (
             order by ts_rank_cd(n.fts, websearch_to_tsquery('public.spanish_unaccent', query_text)) desc
           ) as rank_ix
    from public.notes n
    where n.fts @@ websearch_to_tsquery('public.spanish_unaccent', query_text)
      and (date_from is null or n.entry_date >= date_from)
      and (date_to is null or n.entry_date <= date_to)
    order by rank_ix
    limit least(match_count, 30) * 2
  ),
  nearest as materialized (
    select n.id, n.embedding <=> query_embedding as distance
    from public.notes n
    where n.embedding is not null
      and (date_from is null or n.entry_date >= date_from)
      and (date_to is null or n.entry_date <= date_to)
    order by n.embedding <=> query_embedding
    limit least(match_count, 30) * 2
  ),
  semantic as (
    -- «+ 0» obliga a reordenar: con relaxed_order el orden de `nearest` es aproximado
    -- y Postgres 17 podría reutilizarlo sin volver a ordenar.
    select nearest.id, row_number() over (order by nearest.distance + 0) as rank_ix
    from nearest
  )
  select n.id,
         n.entry_date,
         n.title,
         left(n.content, 400),
         n.tags,
         (coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight
            + coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight)::double precision
  from full_text ft
  full outer join semantic s on ft.id = s.id
  join public.notes n on n.id = coalesce(ft.id, s.id)
  order by 6 desc
  limit least(match_count, 30);
end;
$$;

-- Gasto por categoría en un rango de días locales.
create or replace function public.spending_summary(
  p_from     date,
  p_to       date,
  p_user_id  uuid default null
)
returns table (
  category  public.transaction_category,
  kind      public.transaction_kind,
  total     numeric,
  tx_count  bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ctx as (
    select p.id as uid, p.timezone as tz
    from public.profiles p
    where p.id = coalesce(p_user_id, (select auth.uid()))
  )
  select t.category, t.kind, sum(t.amount), count(*)
  from public.financial_transactions t
  join ctx on t.user_id = ctx.uid
  where t.occurred_at >= (p_from::timestamp at time zone ctx.tz)
    and t.occurred_at <  ((p_to + 1)::timestamp at time zone ctx.tz)
  group by t.category, t.kind
  order by 3 desc;
$$;

-- Progresión de un ejercicio por sesión: mejor serie, 1RM estimado (Epley) y volumen.
create or replace function public.exercise_progress(
  p_exercise  text,
  p_from      date default null,
  p_user_id   uuid default null
)
returns table (
  workout_id     uuid,
  performed_on   date,
  top_weight_kg  numeric,
  best_e1rm_kg   numeric,
  volume_kg      numeric,
  sets           integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ctx as (
    select p.id as uid, p.timezone as tz
    from public.profiles p
    where p.id = coalesce(p_user_id, (select auth.uid()))
  )
  select w.id,
         (w.started_at at time zone ctx.tz)::date,
         max(l.weight_kg),
         round(max(l.weight_kg * (1 + l.reps / 30.0)), 1),
         sum(l.reps * l.weight_kg),
         count(*)::integer
  from public.workout_logs l
  join public.workouts w on w.id = l.workout_id and w.user_id = l.user_id
  join ctx on l.user_id = ctx.uid
  where lower(l.exercise) = lower(p_exercise)
    and not l.is_warmup
    and l.reps > 0
    and (p_from is null or w.started_at >= (p_from::timestamp at time zone ctx.tz))
  group by w.id, w.started_at, ctx.tz
  order by w.started_at;
$$;

-- Totales de nutrición por día local, con los objetivos del perfil.
create or replace function public.nutrition_daily(
  p_from     date,
  p_to       date,
  p_user_id  uuid default null
)
returns table (
  day             date,
  calories_kcal   bigint,
  protein_g       numeric,
  carbs_g         numeric,
  fat_g           numeric,
  meals           bigint,
  kcal_target     integer,
  protein_target  integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ctx as (
    select p.id as uid, p.timezone as tz, p.daily_kcal_target, p.daily_protein_g_target
    from public.profiles p
    where p.id = coalesce(p_user_id, (select auth.uid()))
  )
  select (m.eaten_at at time zone ctx.tz)::date,
         sum(m.calories_kcal),
         sum(m.protein_g),
         sum(m.carbs_g),
         sum(m.fat_g),
         count(*),
         ctx.daily_kcal_target,
         ctx.daily_protein_g_target
  from public.macros m
  join ctx on m.user_id = ctx.uid
  where m.eaten_at >= (p_from::timestamp at time zone ctx.tz)
    and m.eaten_at <  ((p_to + 1)::timestamp at time zone ctx.tz)
  group by 1, ctx.daily_kcal_target, ctx.daily_protein_g_target
  order by 1;
$$;

-- Cumplimiento de hábitos en un rango y racha diaria actual (huecos e islas).
create or replace function public.habit_stats(
  p_from     date,
  p_to       date,
  p_user_id  uuid default null
)
returns table (
  habit_id           uuid,
  name               text,
  cadence            public.habit_cadence,
  target_per_period  smallint,
  done_days          bigint,
  current_streak     integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ctx as (
    select p.id as uid, (now() at time zone p.timezone)::date as today
    from public.profiles p
    where p.id = coalesce(p_user_id, (select auth.uid()))
  ),
  logs as (
    select l.habit_id, l.logged_on
    from public.habit_logs l
    join ctx on l.user_id = ctx.uid
  ),
  islands as (
    -- días consecutivos comparten (fecha − número de fila)
    select logs.habit_id,
           logs.logged_on,
           logs.logged_on - (row_number() over (partition by logs.habit_id order by logs.logged_on))::integer as grp
    from logs
  ),
  streaks as (
    select i.habit_id, max(i.logged_on) as last_day, count(*)::integer as len
    from islands i
    group by i.habit_id, i.grp
  )
  select h.id,
         h.name,
         h.cadence,
         h.target_per_period,
         (select count(*) from logs
           where logs.habit_id = h.id and logs.logged_on between p_from and p_to),
         case when h.cadence = 'daily' then
           coalesce((select s.len from streaks s
                      where s.habit_id = h.id and s.last_day >= ctx.today - 1
                      order by s.last_day desc
                      limit 1), 0)
         end
  from public.habits h
  join ctx on h.user_id = ctx.uid
  where h.archived_at is null
  order by h.sort_order, h.name;
$$;

-- Minutos de foco por día local.
create or replace function public.focus_stats(
  p_from     date,
  p_to       date,
  p_user_id  uuid default null
)
returns table (
  day            date,
  sessions       bigint,
  focus_minutes  numeric,
  interruptions  bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with ctx as (
    select p.id as uid, p.timezone as tz
    from public.profiles p
    where p.id = coalesce(p_user_id, (select auth.uid()))
  )
  select (f.started_at at time zone ctx.tz)::date,
         count(*),
         round(sum(f.duration_s) / 60.0, 1),
         sum(f.interruptions)
  from public.focus_sessions f
  join ctx on f.user_id = ctx.uid
  where f.duration_s is not null
    and f.started_at >= (p_from::timestamp at time zone ctx.tz)
    and f.started_at <  ((p_to + 1)::timestamp at time zone ctx.tz)
  group by 1
  order by 1;
$$;

-- Gasto de IA del mes natural en curso (zona del usuario).
create or replace function public.ai_spend_this_month(p_user_id uuid default null)
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(r.cost_usd), 0)
  from public.ai_runs r
  join public.profiles p on p.id = r.user_id
  where r.user_id = coalesce(p_user_id, (select auth.uid()))
    and r.created_at >= (date_trunc('month', now() at time zone p.timezone) at time zone p.timezone);
$$;


-- -----------------------------------------------------------------------------
-- 7 · Row Level Security
-- -----------------------------------------------------------------------------

-- Tablas de dominio: CRUD completo sobre las filas propias.
do $$
declare
  t text;
begin
  foreach t in array array[
    'workouts', 'workout_logs', 'financial_transactions', 'notes', 'macros',
    'media_items', 'habits', 'habit_logs', 'focus_sessions'
  ]
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

-- Perfil: leer y editar el propio. Lo crea el trigger de registro; se borra en cascada con la cuenta.
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Briefings: los escribe solo el job programado (clave secreta, salta RLS); el usuario lee
-- y marca leído / valora (los permisos de columna de §8 limitan qué puede cambiar).
alter table public.daily_briefings enable row level security;
create policy daily_briefings_select_own on public.daily_briefings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy daily_briefings_update_own on public.daily_briefings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Registro de IA: se inserta con la sesión del usuario y nunca se edita ni se borra,
-- así que el consumo del mes no se puede «resetear».
alter table public.ai_runs enable row level security;
create policy ai_runs_select_own on public.ai_runs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ai_runs_insert_own on public.ai_runs
  for insert to authenticated with check ((select auth.uid()) = user_id);


-- -----------------------------------------------------------------------------
-- 8 · Privilegios (defensa en profundidad sobre RLS)
-- -----------------------------------------------------------------------------
-- Nada es accesible sin sesión.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;

-- Columnas editables por el usuario.
revoke update on public.profiles from authenticated;
grant update (
  display_name, timezone, currency, daily_kcal_target, daily_protein_g_target,
  daily_carbs_g_target, daily_fat_g_target, monthly_budget, briefing_enabled, ai_monthly_budget_usd
) on public.profiles to authenticated;

revoke update on public.daily_briefings from authenticated;
grant update (read_at, feedback) on public.daily_briefings to authenticated;

revoke update, delete on public.ai_runs from authenticated;


-- -----------------------------------------------------------------------------
-- 9 · Storage: buckets privados, una carpeta por usuario ({user_id}/{uuid}.ext)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts',    'receipts',    false, 5242880,  array['image/webp', 'image/jpeg', 'image/png']),
  ('meal-photos', 'meal-photos', false, 5242880,  array['image/webp', 'image/jpeg', 'image/png']),
  ('voice-notes', 'voice-notes', false, 15728640, array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'])
on conflict (id) do nothing;

create policy user_files_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id in ('receipts', 'meal-photos', 'voice-notes')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy user_files_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('receipts', 'meal-photos', 'voice-notes')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy user_files_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('receipts', 'meal-photos', 'voice-notes')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
