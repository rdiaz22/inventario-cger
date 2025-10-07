-- Tabla para control de intentos de login (IP+email) con ventana temporal
create table if not exists auth_rate_limits (
  key text primary key,
  attempts integer not null default 0,
  last_attempt timestamptz not null default now(),
  blocked_until timestamptz,
  meta jsonb default '{}'
);

-- Index para consultas por tiempo
create index if not exists auth_rate_limits_last_attempt_idx on auth_rate_limits (last_attempt desc);

-- Permitir acceso a la función edge con service key; lectura no expuesta a público
alter table auth_rate_limits enable row level security;
create policy if not exists "auth_rate_limits_service_only" on auth_rate_limits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


