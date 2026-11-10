-- =============================================================================
-- Esquema inicial de Orienta+ (docs/architecture/diseno-backend.md).
--
-- Regla de acceso (decisión 0001): todas las tablas tienen RLS activado y
-- NINGUNA política. Además se revocan los permisos de anon y authenticated.
-- Solo la Edge Function "api" accede, con la clave secret (rol service_role,
-- que omite RLS). La app nunca consulta tablas directamente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enumerados. Mismos valores y orden que
-- supabase/functions/_shared/domain/types.ts: en Postgres un enum se compara
-- por su orden de declaración, que va de menor a mayor.
-- -----------------------------------------------------------------------------
create type public.opportunity_category as enum (
  'employment', 'training', 'scholarship', 'subsidy', 'entrepreneurship'
);

create type public.education_level as enum (
  'secondary_incomplete', 'secondary', 'technical', 'technologist',
  'university_incomplete', 'university', 'postgraduate'
);

create type public.experience_level as enum ('none', 'lt_1y', '1_3y', 'gt_3y');

create type public.current_situation as enum (
  'studying', 'working', 'both', 'neither'
);

create type public.availability as enum (
  'full_time', 'part_time', 'weekends', 'flexible'
);

create type public.opportunity_status as enum ('active', 'closed', 'withdrawn');

create type public.opportunity_modality as enum ('in_person', 'virtual', 'hybrid');

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Municipios (códigos DIVIPOLA del DANE)
-- -----------------------------------------------------------------------------
create table public.municipalities (
  code text primary key check (code ~ '^\d{5}$'),
  name text not null,
  department_name text not null,
  -- true para Bogotá y Sabana Centro (decisión 0004).
  in_scope boolean not null default false
);

-- -----------------------------------------------------------------------------
-- Perfiles. Los campos del perfil admiten null porque se diligencia y guarda
-- paso a paso para poder retomarlo (Fase 2, compromiso C3). El consentimiento
-- sí es obligatorio: sin él no se crea el perfil (Ley 1581 de 2012).
-- -----------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date check (birth_date > date '1900-01-01'),
  municipality_code text references public.municipalities (code),
  education_level public.education_level,
  experience_level public.experience_level,
  current_situation public.current_situation,
  interests public.opportunity_category[] not null default '{}',
  availability public.availability,
  completed_steps smallint not null default 0 check (completed_steps >= 0),
  consent_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Oportunidades curadas (decisión 0007). Un null en las columnas de
-- elegibilidad significa "sin restricción".
-- -----------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  summary_plain text not null check (char_length(summary_plain) > 0),
  category public.opportunity_category not null,
  entity_name text not null,
  official_url text not null check (official_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  -- null si es una convocatoria abierta (sin fecha límite).
  deadline date,
  min_age smallint check (min_age between 0 and 120),
  max_age smallint check (max_age between 0 and 120),
  min_education public.education_level,
  min_experience public.experience_level,
  availability public.availability[],
  -- Códigos DIVIPOLA; null si es nacional o virtual. Postgres no permite
  -- claves foráneas sobre elementos de un arreglo: se validan al cargar datos.
  municipality_codes text[],
  modality public.opportunity_modality not null,
  requirements text[] not null default '{}',
  -- Lista de chequeo de verificación (Fase 1, sección III-C).
  check_official_source boolean not null,
  check_entity_real boolean not null,
  check_current boolean not null,
  check_requirements_complete boolean not null,
  check_official_link boolean not null,
  verified_by text not null,
  verified_at timestamptz not null,
  status public.opportunity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_age_range
    check (min_age is null or max_age is null or min_age <= max_age),
  -- Solo se cargan oportunidades que pasan los cinco chequeos.
  constraint opportunities_verified check (
    check_official_source and check_entity_real and check_current
    and check_requirements_complete and check_official_link
  )
);

create index opportunities_active_deadline_idx
  on public.opportunities (deadline)
  where status = 'active';

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Oportunidades vistas, para retomar el progreso (Fase 2, compromiso C3).
-- -----------------------------------------------------------------------------
create table public.opportunity_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

-- -----------------------------------------------------------------------------
-- Segundo factor TOTP (decisión 0002). El secreto se guarda cifrado con
-- AES-GCM (supabase/functions/_shared/security/secret-encryption.ts).
-- -----------------------------------------------------------------------------
create table public.mfa_factors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret_ciphertext bytea not null,
  secret_iv bytea not null check (octet_length(secret_iv) = 12),
  -- null mientras la inscripción no se confirma con un primer código válido.
  confirmed_at timestamptz,
  -- Última ventana TOTP aceptada (anti-replay, RFC 6238 §5.2).
  last_used_step bigint,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Retos de step-up: un solo uso y 5 minutos de vigencia. Se guarda el hash
-- del step_up_token, nunca el token.
-- -----------------------------------------------------------------------------
create table public.step_up_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  action text not null check (action in ('data_export', 'account_deletion')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index step_up_challenges_user_idx on public.step_up_challenges (user_id);

-- -----------------------------------------------------------------------------
-- Funciones atómicas. Hacen la comprobación y la actualización en una sola
-- sentencia UPDATE para que dos peticiones simultáneas con el mismo código o
-- el mismo reto no puedan tener éxito las dos.
-- -----------------------------------------------------------------------------

-- Registra una ventana TOTP como usada. Devuelve false si la ventana es igual
-- o anterior a la última usada (repetición) o si el factor no está confirmado.
create function public.consume_totp_step(p_user_id uuid, p_step bigint)
returns boolean
language sql
set search_path = ''
as $$
  with updated as (
    update public.mfa_factors
       set last_used_step = p_step
     where user_id = p_user_id
       and confirmed_at is not null
       and (last_used_step is null or last_used_step < p_step)
    returning 1
  )
  select exists (select 1 from updated);
$$;

-- Marca un reto de step-up como consumido si existe, está vigente y no se ha
-- usado. Devuelve su usuario y acción, o ninguna fila.
create function public.consume_step_up_challenge(p_token_hash text)
returns table (user_id uuid, action text)
language sql
set search_path = ''
as $$
  update public.step_up_challenges
     set consumed_at = now()
   where token_hash = p_token_hash
     and consumed_at is null
     and expires_at > now()
  returning step_up_challenges.user_id, step_up_challenges.action;
$$;

-- -----------------------------------------------------------------------------
-- Acceso: RLS sin políticas y revocación explícita para anon y authenticated.
-- -----------------------------------------------------------------------------
alter table public.municipalities enable row level security;
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_views enable row level security;
alter table public.mfa_factors enable row level security;
alter table public.step_up_challenges enable row level security;

revoke all on table
  public.municipalities, public.profiles, public.opportunities,
  public.opportunity_views, public.mfa_factors, public.step_up_challenges
from anon, authenticated;

revoke execute on function
  public.set_updated_at(),
  public.consume_totp_step(uuid, bigint),
  public.consume_step_up_challenge(text)
from public, anon, authenticated;
