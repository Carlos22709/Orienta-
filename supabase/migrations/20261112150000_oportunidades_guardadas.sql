-- =============================================================================
-- Oportunidades guardadas (♡) de cada persona (docs/architecture/diseno-backend.md).
--
-- Antes vivían solo en el teléfono y se perdían al cerrar sesión. En el
-- servidor siguen a la persona entre sesiones y teléfonos, y se borran solo
-- al eliminar la cuenta (on delete cascade desde auth.users).
--
-- Misma regla de acceso que el esquema inicial (decisión 0001): RLS activado,
-- ninguna política y sin permisos para anon ni authenticated.
-- =============================================================================

create table public.saved_opportunities (
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

alter table public.saved_opportunities enable row level security;

revoke all on table public.saved_opportunities from anon, authenticated;
