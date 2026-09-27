-- supabase/tests/database/rls.test.sql · ejecutar con `supabase test db`
--
-- Criterio de salida de la Fase 1 (PROPOSAL §5): el usuario A no puede leer, escribir ni
-- referenciar filas del usuario B en ninguna tabla. Amplía la suite de ARCHITECTURE §2.3,
-- que solo cubría 6 de las 12 tablas, a todas ellas, a Storage, a `anon` y a las RPC.
begin;
-- Con `supabase test db --linked` la CLI entra como cli_login_postgres: miembro de postgres pero
-- sin heredar sus permisos (NOINHERIT) y sin `extensions` en el search_path. Se asume el rol
-- postgres y se fija el search_path para que la suite corra igual en local y en remoto.
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(64);

-- -----------------------------------------------------------------------------
-- Datos, como superusuario (sin RLS)
-- A = 11111111-…, B = 22222222-…; el trigger de registro crea sus perfiles.
-- -----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@dossier.test'),
  ('22222222-2222-4222-8222-222222222222', 'b@dossier.test');

-- Una fila de B en cada tabla.
insert into public.workouts (id, user_id, title)
values ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Pierna B');
insert into public.workout_logs (user_id, workout_id, exercise, set_index, reps, weight_kg)
values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000001', 'Sentadilla', 1, 5, 100);
insert into public.financial_transactions (user_id, amount, category, merchant)
values ('22222222-2222-4222-8222-222222222222', 42.00, 'restaurants', 'Bar de B');
insert into public.notes (user_id, entry_date, content)
values ('22222222-2222-4222-8222-222222222222', '2026-09-27', 'Nota privada de B');
insert into public.macros (user_id, meal_type, description, calories_kcal)
values ('22222222-2222-4222-8222-222222222222', 'lunch', 'Comida de B', 650);
insert into public.media_items (user_id, kind, title)
values ('22222222-2222-4222-8222-222222222222', 'book', 'Libro de B');
insert into public.habits (id, user_id, name)
values ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Meditar');
insert into public.habit_logs (user_id, habit_id, logged_on)
values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000002', '2026-09-27');
insert into public.focus_sessions (user_id, label)
values ('22222222-2222-4222-8222-222222222222', 'Foco de B');
insert into public.daily_briefings (user_id, briefing_date, content, metrics, model)
values ('22222222-2222-4222-8222-222222222222', '2026-09-27', '{}', '{}', 'test');
insert into public.ai_runs (user_id, task, model, status, latency_ms, cost_usd)
values ('22222222-2222-4222-8222-222222222222', 'chat', 'test', 'ok', 100, 0.5);
insert into storage.objects (bucket_id, name)
values ('receipts', '22222222-2222-4222-8222-222222222222/ticket.webp');

-- Filas propias de A: un briefing (solo lo escribe el job) y un registro de IA.
insert into public.daily_briefings (user_id, briefing_date, content, metrics, model)
values ('11111111-1111-4111-8111-111111111111', '2026-09-27', '{}', '{}', 'test');
insert into public.ai_runs (user_id, task, model, status, latency_ms)
values ('11111111-1111-4111-8111-111111111111', 'chat', 'test', 'ok', 100);

-- Ejecuta una sentencia y devuelve cuántas filas ha tocado. SECURITY INVOKER: con la sesión
-- de A, RLS filtra en silencio y un update o delete sobre filas ajenas toca 0 filas.
create function pg_temp.affected(statement text) returns integer
language plpgsql as $$
declare
  n integer;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end;
$$;


-- -----------------------------------------------------------------------------
-- Estructura (3)
-- -----------------------------------------------------------------------------
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'Ninguna tabla de public queda sin RLS');

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'v', 'm')
       and has_table_privilege('anon', c.oid, 'select, insert, update, delete') $$,
  'anon no tiene privilegios sobre ninguna tabla de public');

select is_empty(
  $$ select p.proname from pg_proc p
     where p.pronamespace = 'public'::regnamespace and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon no puede ejecutar ninguna función de public');


-- -----------------------------------------------------------------------------
-- A partir de aquí, sesión de A.
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';


-- Leer (13) -------------------------------------------------------------------
select is_empty($$ select 1 from public.workouts where user_id <> auth.uid() $$, 'A no ve los entrenos de B');
select is_empty($$ select 1 from public.workout_logs where user_id <> auth.uid() $$, 'A no ve las series de B');
select is_empty($$ select 1 from public.financial_transactions where user_id <> auth.uid() $$, 'A no ve los movimientos de B');
select is_empty($$ select 1 from public.notes where user_id <> auth.uid() $$, 'A no ve las notas de B');
select is_empty($$ select 1 from public.macros where user_id <> auth.uid() $$, 'A no ve las comidas de B');
select is_empty($$ select 1 from public.media_items where user_id <> auth.uid() $$, 'A no ve las fichas de B');
select is_empty($$ select 1 from public.habits where user_id <> auth.uid() $$, 'A no ve los hábitos de B');
select is_empty($$ select 1 from public.habit_logs where user_id <> auth.uid() $$, 'A no ve los check-ins de B');
select is_empty($$ select 1 from public.focus_sessions where user_id <> auth.uid() $$, 'A no ve las sesiones de foco de B');
select is_empty($$ select 1 from public.daily_briefings where user_id <> auth.uid() $$, 'A no ve los briefings de B');
select is_empty($$ select 1 from public.ai_runs where user_id <> auth.uid() $$, 'A no ve el registro de IA de B');
select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
  'A solo ve su perfil');
select is_empty(
  $$ select 1 from storage.objects where name like '22222222-2222-4222-8222-222222222222/%' $$,
  'A no ve los archivos de B');


-- Escribir como B (13) --------------------------------------------------------
select throws_ok(
  $$ insert into public.workouts (user_id, title) values ('22222222-2222-4222-8222-222222222222', 'x') $$,
  '42501', null, 'A no puede crear entrenos a nombre de B');
select throws_ok(
  $$ insert into public.workout_logs (user_id, workout_id, exercise, set_index, reps)
     values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000001', 'x', 2, 5) $$,
  '42501', null, 'A no puede crear series a nombre de B');
select throws_ok(
  $$ insert into public.financial_transactions (user_id, amount) values ('22222222-2222-4222-8222-222222222222', 1) $$,
  '42501', null, 'A no puede crear movimientos a nombre de B');
select throws_ok(
  $$ insert into public.notes (user_id, entry_date, content)
     values ('22222222-2222-4222-8222-222222222222', '2026-09-27', 'x') $$,
  '42501', null, 'A no puede crear notas a nombre de B');
select throws_ok(
  $$ insert into public.macros (user_id, meal_type, description, calories_kcal)
     values ('22222222-2222-4222-8222-222222222222', 'snack', 'x', 1) $$,
  '42501', null, 'A no puede crear comidas a nombre de B');
select throws_ok(
  $$ insert into public.media_items (user_id, kind, title) values ('22222222-2222-4222-8222-222222222222', 'film', 'x') $$,
  '42501', null, 'A no puede crear fichas a nombre de B');
select throws_ok(
  $$ insert into public.habits (user_id, name) values ('22222222-2222-4222-8222-222222222222', 'x') $$,
  '42501', null, 'A no puede crear hábitos a nombre de B');
select throws_ok(
  $$ insert into public.habit_logs (user_id, habit_id, logged_on)
     values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000002', '2026-09-26') $$,
  '42501', null, 'A no puede crear check-ins a nombre de B');
select throws_ok(
  $$ insert into public.focus_sessions (user_id) values ('22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'A no puede crear sesiones de foco a nombre de B');
select throws_ok(
  $$ insert into public.ai_runs (user_id, task, model, status, latency_ms)
     values ('22222222-2222-4222-8222-222222222222', 'chat', 'x', 'ok', 1) $$,
  '42501', null, 'A no puede cargar consumo de IA a B');
select throws_ok(
  $$ insert into public.daily_briefings (user_id, briefing_date, content, metrics, model)
     values ('11111111-1111-4111-8111-111111111111', '2026-09-28', '{}', '{}', 'x') $$,
  '42501', null, 'A no puede crear briefings, ni siquiera los suyos');
select throws_ok(
  $$ insert into public.profiles (id) values ('33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'A no puede crear perfiles');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('receipts', '22222222-2222-4222-8222-222222222222/intruso.webp') $$,
  '42501', null, 'A no puede subir archivos a la carpeta de B');


-- Referenciar (5) -------------------------------------------------------------
-- Otro ejercicio que el de la serie de B: con el mismo, la restricción única saltaría antes que la FK.
select throws_ok(
  $$ insert into public.workout_logs (workout_id, exercise, set_index, reps)
     values ('bbbbbbbb-0000-4000-8000-000000000001', 'Peso muerto', 1, 5) $$,
  '23503', null, 'La FK compuesta impide colgar series de un entreno de B');
select throws_ok(
  $$ insert into public.habit_logs (habit_id, logged_on) values ('bbbbbbbb-0000-4000-8000-000000000002', '2026-09-26') $$,
  '23503', null, 'La FK compuesta impide colgar check-ins de un hábito de B');
select throws_ok(
  $$ insert into public.financial_transactions (amount, receipt_path)
     values (1, '22222222-2222-4222-8222-222222222222/ticket.webp') $$,
  '23514', null, 'Un movimiento de A no puede apuntar a un ticket de B');
select throws_ok(
  $$ insert into public.macros (meal_type, description, calories_kcal, photo_path)
     values ('snack', 'x', 1, '22222222-2222-4222-8222-222222222222/plato.webp') $$,
  '23514', null, 'Una comida de A no puede apuntar a una foto de B');
select throws_ok(
  $$ insert into public.notes (entry_date, content, audio_path)
     values ('2026-09-27', 'x', '22222222-2222-4222-8222-222222222222/nota.webm') $$,
  '23514', null, 'Una nota de A no puede apuntar a un audio de B');


-- Editar filas de B: RLS las filtra y el update toca 0 filas (11) ----------------
select is(pg_temp.affected($$ update public.workouts set title = 'x' where user_id <> auth.uid() $$), 0, 'A no puede editar los entrenos de B');
select is(pg_temp.affected($$ update public.workout_logs set reps = 1 where user_id <> auth.uid() $$), 0, 'A no puede editar las series de B');
select is(pg_temp.affected($$ update public.financial_transactions set amount = 1 where user_id <> auth.uid() $$), 0, 'A no puede editar los movimientos de B');
select is(pg_temp.affected($$ update public.notes set content = 'x' where user_id <> auth.uid() $$), 0, 'A no puede editar las notas de B');
select is(pg_temp.affected($$ update public.macros set calories_kcal = 1 where user_id <> auth.uid() $$), 0, 'A no puede editar las comidas de B');
select is(pg_temp.affected($$ update public.media_items set title = 'x' where user_id <> auth.uid() $$), 0, 'A no puede editar las fichas de B');
select is(pg_temp.affected($$ update public.habits set name = 'x' where user_id <> auth.uid() $$), 0, 'A no puede editar los hábitos de B');
select is(pg_temp.affected($$ update public.habit_logs set times = 2 where user_id <> auth.uid() $$), 0, 'A no puede editar los check-ins de B');
select is(pg_temp.affected($$ update public.focus_sessions set interruptions = 1 where user_id <> auth.uid() $$), 0, 'A no puede editar las sesiones de foco de B');
select is(pg_temp.affected($$ update public.daily_briefings set read_at = now() where user_id <> auth.uid() $$), 0, 'A no puede marcar como leídos los briefings de B');
select is(pg_temp.affected($$ update public.profiles set display_name = 'x' where id <> auth.uid() $$), 0, 'A no puede editar el perfil de B');


-- Borrar filas de B: 0 filas (11) ----------------------------------------------
select is(pg_temp.affected($$ delete from public.workouts where user_id <> auth.uid() $$), 0, 'A no puede borrar los entrenos de B');
select is(pg_temp.affected($$ delete from public.workout_logs where user_id <> auth.uid() $$), 0, 'A no puede borrar las series de B');
select is(pg_temp.affected($$ delete from public.financial_transactions where user_id <> auth.uid() $$), 0, 'A no puede borrar los movimientos de B');
select is(pg_temp.affected($$ delete from public.notes where user_id <> auth.uid() $$), 0, 'A no puede borrar las notas de B');
select is(pg_temp.affected($$ delete from public.macros where user_id <> auth.uid() $$), 0, 'A no puede borrar las comidas de B');
select is(pg_temp.affected($$ delete from public.media_items where user_id <> auth.uid() $$), 0, 'A no puede borrar las fichas de B');
select is(pg_temp.affected($$ delete from public.habits where user_id <> auth.uid() $$), 0, 'A no puede borrar los hábitos de B');
select is(pg_temp.affected($$ delete from public.habit_logs where user_id <> auth.uid() $$), 0, 'A no puede borrar los check-ins de B');
select is(pg_temp.affected($$ delete from public.focus_sessions where user_id <> auth.uid() $$), 0, 'A no puede borrar las sesiones de foco de B');
select is(pg_temp.affected($$ delete from public.daily_briefings $$), 0, 'A no puede borrar briefings, ni siquiera los suyos');
select is(pg_temp.affected($$ delete from public.profiles $$), 0, 'A no puede borrar perfiles, ni siquiera el suyo');


-- Lo propio: lo que sí puede y lo que ni siquiera en lo suyo (8) ------------------
select lives_ok(
  $$ insert into public.notes (entry_date, content) values ('2026-09-27', 'Nota de A') $$,
  'A escribe sin enviar user_id: lo pone auth.uid()');
select is(
  pg_temp.affected($$ update public.daily_briefings set read_at = now(), feedback = '{"x": "up"}' $$), 1,
  'A puede marcar su briefing como leído y valorarlo');
select throws_ok(
  $$ update public.daily_briefings set content = '{}' $$,
  '42501', null, 'A no puede reescribir el contenido de un briefing');
select throws_ok(
  $$ update public.ai_runs set cost_usd = 0 $$,
  '42501', null, 'A no puede rebajar su consumo de IA');
select throws_ok(
  $$ delete from public.ai_runs $$,
  '42501', null, 'A no puede borrar su registro de IA');
select throws_ok(
  $$ update public.profiles set id = '33333333-3333-4333-8333-333333333333' $$,
  '42501', null, 'A no puede cambiar el id de su perfil');
select is_empty(
  $$ select * from public.spending_summary('2026-01-01', '2026-12-31', '22222222-2222-4222-8222-222222222222') $$,
  'Pedir el gasto de B por p_user_id devuelve vacío');
select is(
  public.ai_spend_this_month('22222222-2222-4222-8222-222222222222'), 0::numeric,
  'Pedir el consumo de IA de B por p_user_id devuelve 0');

select * from finish();
rollback;
