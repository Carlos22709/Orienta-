-- =============================================================================
-- Datos semilla de Orienta+. Se cargan con: npx supabase db reset
--
-- Municipios en alcance (decisión 0004): Bogotá D. C. y Sabana Centro.
-- Fuente: DANE, "DIVIPOLA - Códigos municipios", publicado en datos.gov.co
-- (conjunto gdxc-w37w, campos cod_mpio, nom_mpio y dpto), consultado el
-- 2026-11-09 en https://www.datos.gov.co/resource/gdxc-w37w.json
-- Los códigos son los publicados; los nombres se escriben con mayúscula
-- inicial (la fuente los publica en mayúsculas sostenidas).
--
-- Las oportunidades reales se agregan aquí cuando el equipo las verifique
-- (decisión 0007). No se cargan oportunidades ficticias.
-- =============================================================================

insert into public.municipalities (code, name, department_name, in_scope)
values
  ('11001', 'Bogotá, D.C.', 'Bogotá, D.C.', true),
  ('25126', 'Cajicá', 'Cundinamarca', true),
  ('25175', 'Chía', 'Cundinamarca', true),
  ('25200', 'Cogua', 'Cundinamarca', true),
  ('25214', 'Cota', 'Cundinamarca', true),
  ('25295', 'Gachancipá', 'Cundinamarca', true),
  ('25486', 'Nemocón', 'Cundinamarca', true),
  ('25758', 'Sopó', 'Cundinamarca', true),
  ('25785', 'Tabio', 'Cundinamarca', true),
  ('25799', 'Tenjo', 'Cundinamarca', true),
  ('25817', 'Tocancipá', 'Cundinamarca', true),
  ('25899', 'Zipaquirá', 'Cundinamarca', true)
on conflict (code) do update
  set name = excluded.name,
      department_name = excluded.department_name,
      in_scope = excluded.in_scope;
