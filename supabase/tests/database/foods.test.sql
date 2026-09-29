-- supabase/tests/database/foods.test.sql · ejecutar con `supabase test db`
--
-- Catálogo de alimentos y platos guardados (migraciones 20260929000000 y 000001): el catálogo
-- es de solo lectura, los platos se aíslan por cuenta como el resto del dominio y
-- `search_foods` encuentra lo que se escribe con tildes, erratas o preposiciones.
-- Las comprobaciones generales de rls.test.sql (RLS en todas las tablas, anon sin privilegios
-- ni funciones) ya cubren las tablas y la función nuevas.
begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- -----------------------------------------------------------------------------
-- Datos, como superusuario (sin RLS)
-- -----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@dossier.test'),
  ('22222222-2222-4222-8222-222222222222', 'b@dossier.test');

-- Un plato de B con un ingrediente (lenteja cocida).
insert into public.dishes (id, user_id, name)
values ('bbbbbbbb-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', 'Lentejas de B');
insert into public.dish_items (user_id, dish_id, food_id, grams)
values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000010', 20360, 300);

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

select is((select count(*) from public.foods), 3181::bigint, 'El catálogo carga los 3.181 alimentos de CIQUAL');


-- -----------------------------------------------------------------------------
-- A partir de aquí, sesión de A.
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';


-- Catálogo: se lee, no se escribe (4) -------------------------------------------
select is((select count(*) from public.foods), 3181::bigint, 'A lee el catálogo entero');
select throws_ok(
  $$ insert into public.foods (id, name, category, kcal, protein_g, carbs_g, fat_g)
     values (1, 'Invento', 'Otros', 1, 0, 0, 0) $$,
  '42501', null, 'A no puede añadir alimentos al catálogo');
select throws_ok(
  $$ update public.foods set kcal = 0 where id = 20360 $$,
  '42501', null, 'A no puede cambiar los valores del catálogo');
select throws_ok(
  $$ delete from public.foods where id = 20360 $$,
  '42501', null, 'A no puede borrar alimentos del catálogo');


-- Platos de B: ni leer, ni escribir, ni referenciar (9) --------------------------
select is_empty($$ select 1 from public.dishes where user_id <> auth.uid() $$, 'A no ve los platos de B');
select is_empty($$ select 1 from public.dish_items where user_id <> auth.uid() $$, 'A no ve los ingredientes de B');
select throws_ok(
  $$ insert into public.dishes (user_id, name) values ('22222222-2222-4222-8222-222222222222', 'x') $$,
  '42501', null, 'A no puede crear platos a nombre de B');
select throws_ok(
  $$ insert into public.dish_items (user_id, dish_id, food_id, grams)
     values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-000000000010', 17270, 10) $$,
  '42501', null, 'A no puede añadir ingredientes a nombre de B');
select throws_ok(
  $$ insert into public.dish_items (dish_id, food_id, grams)
     values ('bbbbbbbb-0000-4000-8000-000000000010', 17270, 10) $$,
  '23503', null, 'La FK compuesta impide colgar ingredientes de un plato de B');
select is(pg_temp.affected($$ update public.dishes set name = 'x' where user_id <> auth.uid() $$), 0, 'A no puede editar los platos de B');
select is(pg_temp.affected($$ update public.dish_items set grams = 1 where user_id <> auth.uid() $$), 0, 'A no puede editar los ingredientes de B');
select is(pg_temp.affected($$ delete from public.dish_items where user_id <> auth.uid() $$), 0, 'A no puede borrar los ingredientes de B');
select is(pg_temp.affected($$ delete from public.dishes where user_id <> auth.uid() $$), 0, 'A no puede borrar los platos de B');


-- Platos propios (4) -------------------------------------------------------------
-- Lentejas para 2 raciones: 400 g de lenteja cocida (125 kcal, 10,1 P, 16,2 C, 0,57 G por 100 g)
-- y 20 g de aceite de oliva virgen extra (899 kcal, 0,25 P, 0 C, 99,9 G).
select lives_ok(
  $$ insert into public.dishes (id, name, servings)
     values ('aaaaaaaa-0000-4000-8000-000000000010', 'Lentejas de mamá', 2) $$,
  'A crea un plato sin enviar user_id');
select lives_ok(
  $$ insert into public.dish_items (dish_id, food_id, grams)
     values ('aaaaaaaa-0000-4000-8000-000000000010', 20360, 400),
            ('aaaaaaaa-0000-4000-8000-000000000010', 17270, 20) $$,
  'A añade ingredientes a su plato');
select throws_ok(
  $$ insert into public.dishes (name) values ('LENTEJAS DE MAMA') $$,
  '23505', null, 'Dos platos de la misma cuenta no se llaman igual, ni cambiando mayúsculas o tildes');
select throws_ok(
  $$ insert into public.dish_items (dish_id, food_id, grams) values ('aaaaaaaa-0000-4000-8000-000000000010', 17270, 5) $$,
  '23505', null, 'Un ingrediente no se repite en el mismo plato');


-- create_dish: todo o nada (5) ---------------------------------------------------
select isnt(
  public.create_dish('Tostada con aceite', 1, '[{"food_id": 7001, "grams": 60}, {"food_id": 17270, "grams": 10}]'),
  null, 'create_dish guarda el plato y devuelve su id');
select is(
  (select count(*) from public.dish_items i join public.dishes d on d.id = i.dish_id where d.name = 'Tostada con aceite'),
  2::bigint, 'create_dish guarda sus ingredientes, en la cuenta de quien llama');
select throws_ok(
  $$ select public.create_dish('Vacío', 1, '[]') $$,
  '23514', null, 'Un plato sin ingredientes no se guarda');
select throws_ok(
  $$ select public.create_dish('Con un alimento inventado', 1, '[{"food_id": 7001, "grams": 60}, {"food_id": 1, "grams": 10}]') $$,
  '23503', null, 'Un ingrediente que no existe hace fallar el plato entero');
select is_empty(
  $$ select 1 from public.dishes where name = 'Con un alimento inventado' $$,
  'Y el plato no queda guardado a medias');

-- search_foods (16) --------------------------------------------------------------
select results_eq(
  $$ select kind, name, grams, kcal, protein_g, carbs_g, fat_g from public.search_foods('lentejas') limit 1 $$,
  $$ values ('dish'::text, 'Lentejas de mamá'::text, 210::numeric, 340::numeric, 20.2::numeric, 32.4::numeric, 11.1::numeric) $$,
  'El plato propio sale primero, con los valores de una ración');
select is_empty(
  $$ select 1 from public.search_foods('lentejas', 25) where dish_id = 'bbbbbbbb-0000-4000-8000-000000000010' $$,
  'La búsqueda no devuelve los platos de B');
select ok(
  exists (select 1 from public.search_foods('lentejas', 25) where food_id = 20360),
  'El plural cuenta como el singular: «lentejas» encuentra «Lenteja, cocida (media)»');
select ok(
  not exists (
    select 1
    from public.search_foods('lentejas', 25) with ordinality as a (kind, food_id, dish_id, name, category, grams, kcal, protein_g, carbs_g, fat_g, n)
    join public.search_foods('lentejas', 25) with ordinality as b (kind, food_id, dish_id, name, category, grams, kcal, protein_g, carbs_g, fat_g, n)
      on b.n > a.n
    where a.kind = 'food' and b.kind = 'food'
      and a.name not ilike 'lenteja%' and b.name ilike 'lenteja%'),
  'Lo que empieza por la palabra buscada va antes que lo que solo la contiene');
select ok(
  exists (select 1 from public.search_foods('platano') where name = 'Plátano, sin piel, crudo'),
  'Sin tildes: «platano» encuentra «Plátano, sin piel, crudo»');
select ok(
  exists (select 1 from public.search_foods('PLÁTANO') where name = 'Plátano, sin piel, crudo'),
  'Ni mayúsculas: «PLÁTANO» encuentra lo mismo');
select ok(
  exists (select 1 from public.search_foods('pechga polo', 25) where food_id = 36018),
  'Con erratas: «pechga polo» encuentra «Pollo, pechuga sin piel, a la plancha»');
select ok(
  exists (select 1 from public.search_foods('pechuga de pollo', 25) where food_id = 36018),
  'Las preposiciones no cuentan: «pechuga de pollo» encuentra «Pollo, pechuga…» aunque no diga «de»');
select ok(
  exists (select 1 from public.search_foods('macarrones') where food_id = 9811),
  'Los alias encuentran nombres que CIQUAL no usa: «macarrones» encuentra «Pasta seca, cocida…»');
select is(
  (select name from public.search_foods('espaguetis') limit 1), 'Pasta seca, cruda',
  'Un alias va antes que un nombre que solo empieza igual: «espaguetis» es pasta, no el alga «Espagueti de mar»');
select is(
  (select name from public.search_foods('pollo') limit 1), 'Pollo, carne, crudo',
  'Un alias no adelanta a quien ya lleva la palabra en el nombre: «pollo» no empieza por el fiambre');
select is_empty(
  $$ select 1 from public.search_foods('pan', 25) where name ilike 'papaya%' $$,
  'Las palabras de menos de 4 letras no admiten erratas: «pan» no encuentra «Papaya»');
select is_empty($$ select 1 from public.search_foods('de la') $$, 'Una consulta sin palabras útiles no devuelve nada');
select is_empty($$ select 1 from public.search_foods('') $$, 'Una consulta vacía no devuelve nada');
select is((select count(*) from public.search_foods('queso', 100)), 25::bigint, 'Nunca devuelve más de 25 resultados');
select is(
  pg_temp.affected($$ delete from public.dishes where id = 'aaaaaaaa-0000-4000-8000-000000000010' $$), 1,
  'A borra su plato (y sus ingredientes, en cascada)');

select * from finish();
rollback;
