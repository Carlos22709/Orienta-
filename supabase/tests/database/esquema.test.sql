-- Pruebas pgTAP del esquema inicial (docs/architecture/diseno-backend.md).
-- Se ejecutan con: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- ---------------------------------------------------------------------------
-- Tablas y RLS
-- ---------------------------------------------------------------------------
select has_table('public', 'municipalities', 'existe municipalities');
select has_table('public', 'profiles', 'existe profiles');
select has_table('public', 'opportunities', 'existe opportunities');
select has_table('public', 'opportunity_views', 'existe opportunity_views');
select has_table('public', 'mfa_factors', 'existe mfa_factors');
select has_table('public', 'step_up_challenges', 'existe step_up_challenges');
select has_table('public', 'saved_opportunities', 'existe saved_opportunities');

select is(
  (select count(*)::int from pg_tables
    where schemaname = 'public'
      and tablename in ('municipalities', 'profiles', 'opportunities',
                        'opportunity_views', 'mfa_factors', 'step_up_challenges',
                        'saved_opportunities')
      and rowsecurity),
  7,
  'las siete tablas tienen RLS activado'
);

select is(
  (select count(*)::int from pg_policies where schemaname = 'public'),
  0,
  'no hay políticas: anon y authenticated no tienen acceso por RLS'
);

-- Los enumerados conservan el orden que usa el dominio para comparar niveles.
select ok(
  'technical'::public.education_level > 'secondary'::public.education_level,
  'education_level está ordenado de menor a mayor'
);
select ok(
  'gt_3y'::public.experience_level > 'lt_1y'::public.experience_level,
  'experience_level está ordenado de menor a mayor'
);

-- ---------------------------------------------------------------------------
-- Datos de prueba (ficticios)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000001', 'prueba@example.com');

insert into public.municipalities (code, name, department_name, in_scope)
values ('99999', 'Municipio de prueba', 'Departamento de prueba', true);

-- ---------------------------------------------------------------------------
-- Restricciones de opportunities
-- ---------------------------------------------------------------------------
prepare insert_opportunity(text, boolean) as
  insert into public.opportunities (
    title, summary_plain, category, entity_name, official_url, source_url,
    modality, check_official_source, check_entity_real, check_current,
    check_requirements_complete, check_official_link, verified_by, verified_at
  ) values (
    'Curso de prueba', 'Resumen en lenguaje claro.', 'training',
    'Entidad de prueba', $1, 'https://example.com/fuente', 'virtual',
    true, true, true, true, $2, 'Equipo de prueba', now()
  );

select lives_ok(
  $$ execute insert_opportunity('https://example.com/inscripcion', true) $$,
  'acepta una oportunidad verificada con enlace https'
);
select throws_ok(
  $$ execute insert_opportunity('https://example.com/inscripcion', false) $$,
  '23514',
  null,
  'rechaza una oportunidad que no pasó los cinco chequeos'
);
select throws_ok(
  $$ execute insert_opportunity('http://example.com/inscripcion', true) $$,
  '23514',
  null,
  'rechaza un enlace oficial sin https'
);
select throws_ok(
  $$ insert into public.opportunities (
       title, summary_plain, category, entity_name, official_url, source_url,
       modality, min_age, max_age, check_official_source, check_entity_real,
       check_current, check_requirements_complete, check_official_link,
       verified_by, verified_at)
     values ('Rango inválido', 'Resumen.', 'training', 'Entidad',
       'https://example.com/a', 'https://example.com/b', 'virtual', 30, 18,
       true, true, true, true, true, 'Equipo', now()) $$,
  '23514',
  null,
  'rechaza min_age mayor que max_age'
);

-- ---------------------------------------------------------------------------
-- Guardadas: una sola fila por persona y oportunidad
-- ---------------------------------------------------------------------------
insert into public.saved_opportunities (user_id, opportunity_id)
select '00000000-0000-0000-0000-000000000001', id
  from public.opportunities
 where official_url = 'https://example.com/inscripcion';

select throws_ok(
  $$ insert into public.saved_opportunities (user_id, opportunity_id)
     select user_id, opportunity_id from public.saved_opportunities $$,
  '23505',
  null,
  'no permite guardar dos veces la misma oportunidad'
);

-- ---------------------------------------------------------------------------
-- Anti-replay de TOTP: consume_totp_step es atómica
-- ---------------------------------------------------------------------------
insert into public.mfa_factors (user_id, secret_ciphertext, secret_iv, confirmed_at)
values ('00000000-0000-0000-0000-000000000001', '\x00'::bytea,
        '\x000000000000000000000000'::bytea, now());

select ok(
  public.consume_totp_step('00000000-0000-0000-0000-000000000001', 100),
  'acepta la primera ventana usada'
);
select ok(
  not public.consume_totp_step('00000000-0000-0000-0000-000000000001', 100),
  'rechaza repetir la misma ventana'
);
select ok(
  not public.consume_totp_step('00000000-0000-0000-0000-000000000001', 99),
  'rechaza una ventana anterior a la última usada'
);
select ok(
  public.consume_totp_step('00000000-0000-0000-0000-000000000001', 101),
  'acepta una ventana posterior'
);

-- ---------------------------------------------------------------------------
-- Retos de step-up: un solo uso y con vencimiento
-- ---------------------------------------------------------------------------
insert into public.step_up_challenges (user_id, token_hash, action, expires_at)
values
  ('00000000-0000-0000-0000-000000000001', 'hash-vigente', 'account_deletion',
   now() + interval '5 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'hash-vencido', 'data_export',
   now() - interval '1 second');

select is(
  (select action from public.consume_step_up_challenge('hash-vigente')),
  'account_deletion',
  'consume un reto vigente y devuelve su acción'
);
select is(
  (select count(*)::int from public.consume_step_up_challenge('hash-vigente')),
  0,
  'no permite consumir dos veces el mismo reto'
);
select is(
  (select count(*)::int from public.consume_step_up_challenge('hash-vencido')),
  0,
  'no permite consumir un reto vencido'
);

-- ---------------------------------------------------------------------------
-- Los roles públicos no pueden leer ni ejecutar nada de lo anterior
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  'select * from public.opportunities',
  '42501',
  null,
  'anon no puede leer opportunities'
);
reset role;

set local role authenticated;
select throws_ok(
  'select * from public.mfa_factors',
  '42501',
  null,
  'authenticated no puede leer mfa_factors'
);
select throws_ok(
  'select * from public.saved_opportunities',
  '42501',
  null,
  'authenticated no puede leer saved_opportunities'
);
select throws_ok(
  $$ select public.consume_totp_step('00000000-0000-0000-0000-000000000001', 500) $$,
  '42501',
  null,
  'authenticated no puede ejecutar consume_totp_step'
);
reset role;

-- La Edge Function usa service_role: sí debe poder leer y ejecutar.
set local role service_role;
select lives_ok(
  'select * from public.opportunities',
  'service_role puede leer opportunities'
);
select lives_ok(
  $$ select public.consume_totp_step('00000000-0000-0000-0000-000000000001', 600) $$,
  'service_role puede ejecutar consume_totp_step'
);
reset role;

-- ---------------------------------------------------------------------------
-- Eliminar la cuenta borra sus guardadas en cascada
-- ---------------------------------------------------------------------------
delete from auth.users where id = '00000000-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.saved_opportunities
    where user_id = '00000000-0000-0000-0000-000000000001'),
  0,
  'al eliminar la cuenta se borran sus guardadas'
);

select * from finish();
rollback;
