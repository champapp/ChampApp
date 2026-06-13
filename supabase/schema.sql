-- ============================================================
-- CHAMP APP — esquema inicial (Supabase / Postgres)
-- Pegar y ejecutar completo en: Supabase Dashboard -> SQL Editor -> New query
-- Es seguro re-ejecutar (usa IF NOT EXISTS / OR REPLACE / ON CONFLICT donde aplica).
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- TABLAS
-- ============================================================

-- Plantel. auth_user_id enlaza con la cuenta de Supabase Auth del jugador
-- (login por username+PIN -> email sintetico <username>@champapp.local).
create table if not exists public.players (
  id              bigint generated always as identity primary key,
  nombre          text not null,
  apellido        text not null,
  name            text generated always as (nombre || ' ' || apellido) stored,
  cat             text not null,                 -- PS, M19, M17, M15, M13, M11, M9, M7
  sub             text,                          -- año de nacimiento (categorias menores)
  birth_year      int,
  birth_date      date,
  peso            numeric,
  talla           numeric,
  imc             numeric,
  pos             text,
  pos_short       text,
  pos_type        text,                          -- 'Forward' | 'Back'
  dorsal          int,
  username        text not null unique,
  phone           text,
  emergency_contact text,
  emergency_medical text,
  photo_url       text,
  objetivo        text,
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists players_cat_sub_idx on public.players (cat, sub);

-- Registro fotografico (frente/espalda/perfil), solo lectura para el jugador
create table if not exists public.player_photos (
  id          bigint generated always as identity primary key,
  player_id   bigint not null references public.players(id) on delete cascade,
  date        date not null,
  label       text,
  image_url   text not null,
  created_at  timestamptz not null default now()
);
create index if not exists player_photos_player_idx on public.player_photos (player_id);

-- Mediciones de fuerza / gimnasio
create table if not exists public.gym_marks (
  id          bigint generated always as identity primary key,
  player_id   bigint not null references public.players(id) on delete cascade,
  exercise    text not null,
  value       numeric not null,
  unit        text,
  date        date not null
);
create index if not exists gym_marks_player_idx on public.gym_marks (player_id);

-- Lesiones. closed_at = NULL -> lesion activa; closed_at seteado -> archivada
create table if not exists public.injuries (
  id          bigint generated always as identity primary key,
  player_id   bigint not null references public.players(id) on delete cascade,
  reason      text,
  since       date,
  return_date date,
  closed_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists injuries_player_idx on public.injuries (player_id);

-- Protocolos de recuperacion cargados por fisioterapia
create table if not exists public.injury_protocols (
  id          bigint generated always as identity primary key,
  injury_id   bigint not null references public.injuries(id) on delete cascade,
  text        text not null,
  date        date not null default current_date,
  by          text
);
create index if not exists injury_protocols_injury_idx on public.injury_protocols (injury_id);

-- Documentacion administrativa obligatoria por jugador (con vencimiento)
create table if not exists public.admin_docs (
  id          bigint generated always as identity primary key,
  player_id   bigint not null references public.players(id) on delete cascade,
  type        text not null check (type in ('Ficha médica','Curso Conmoción','Rugby Ready','Antidoping')),
  expiry      date,
  unique (player_id, type)
);
create index if not exists admin_docs_player_idx on public.admin_docs (player_id);

-- Practicas de entrenamiento (una fila por categoria/sub/fecha)
create table if not exists public.practices (
  id          bigint generated always as identity primary key,
  cat         text not null,
  sub         text,
  date        date not null
);
create unique index if not exists practices_unique_idx on public.practices (cat, coalesce(sub, ''), date);
create index if not exists practices_date_idx on public.practices (date);

-- Asistencia a practicas. status: 'P' presente | 'A' ausente
create table if not exists public.attendance (
  practice_id bigint not null references public.practices(id) on delete cascade,
  player_id   bigint not null references public.players(id) on delete cascade,
  status      text not null check (status in ('P','A')),
  updated_at  timestamptz not null default now(),
  primary key (practice_id, player_id)
);
create index if not exists attendance_player_idx on public.attendance (player_id);

-- Partidos
create table if not exists public.matches (
  id          bigint generated always as identity primary key,
  cat         text not null,
  rival       text,
  home        boolean default true,
  place       text,
  date        date not null,
  time        text,                              -- categorias no-PS: horario de kick off
  time_primera       text,                       -- PS: horario de Primera, si juega
  time_intermedia    text,                       -- PS: horario de Intermedia, si juega
  time_preintermedia text,                       -- PS: horario de Pre-Intermedia, si juega
  comp        text,
  cite        text,                              -- categorias no-PS: horario de citacion
  cite_primera       text,                       -- PS: horario de citacion de Primera
  cite_intermedia    text,                       -- PS: horario de citacion de Intermedia
  cite_preintermedia text,                       -- PS: horario de citacion de Pre-Intermedia
  created_at  timestamptz not null default now()
);
create index if not exists matches_cat_date_idx on public.matches (cat, date);

-- migracion: partidos de PS pasan de un campo `div` (una division por partido)
-- a horarios de kick off y citacion separados por division dentro del mismo partido
alter table public.matches drop column if exists div;
alter table public.matches add column if not exists time_primera text;
alter table public.matches add column if not exists time_intermedia text;
alter table public.matches add column if not exists time_preintermedia text;
alter table public.matches add column if not exists cite_primera text;
alter table public.matches add column if not exists cite_intermedia text;
alter table public.matches add column if not exists cite_preintermedia text;

-- Encuesta de disponibilidad (RSVP) por partido y jugador
create table if not exists public.rsvp (
  match_id    bigint not null references public.matches(id) on delete cascade,
  player_id   bigint not null references public.players(id) on delete cascade,
  answer      text check (answer in ('yes','no','doubt')),
  updated_at  timestamptz not null default now(),
  primary key (match_id, player_id)
);
create index if not exists rsvp_player_idx on public.rsvp (player_id);

-- Alineaciones (hasta 23 jugadores). positions = jsonb {"1": playerId, ...}
create table if not exists public.lineups (
  id          bigint generated always as identity primary key,
  match_id    bigint not null references public.matches(id) on delete cascade,
  cat         text,
  name        text,
  positions   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists lineups_match_idx on public.lineups (match_id);

-- Comunicados del club. cats = jsonb con la audiencia (type/cat/sub/cats/playerId)
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  title       text not null,
  body        text,
  cats        jsonb,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);

-- Champa Shop: catalogo
create table if not exists public.shop_items (
  id          bigint generated always as identity primary key,
  name        text not null,
  descr       text,
  price       numeric,
  category    text,
  photos      jsonb not null default '[]'::jsonb,
  sizes       jsonb not null default '[]'::jsonb,  -- [{size, stock}]
  sold        int not null default 0,
  sort        int not null default 0
);

-- Champa Shop: ventas
create table if not exists public.shop_sales (
  id          bigint generated always as identity primary key,
  item_id     bigint not null references public.shop_items(id) on delete cascade,
  size        text,
  qty         int not null default 1,
  date        date not null default current_date
);
create index if not exists shop_sales_item_idx on public.shop_sales (item_id);

-- Rutinas de gimnasio. blocks = [{title, exercises:[{section,name,aprox,detail,rest}]}]
create table if not exists public.routines (
  id          bigint generated always as identity primary key,
  title       text not null,
  cats        jsonb not null default '[]'::jsonb,
  note        text,
  blocks      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- Check de rutina del jugador (= asistencia al gimnasio). Maximo 1 por dia.
create table if not exists public.gym_checks (
  id          bigint generated always as identity primary key,
  player_id   bigint not null references public.players(id) on delete cascade,
  routine_id  bigint references public.routines(id) on delete cascade,
  block       int,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);
create unique index if not exists gym_checks_unique_idx on public.gym_checks (player_id, date);
create index if not exists gym_checks_player_idx on public.gym_checks (player_id);

-- Agenda de fisioterapia (lunes y miercoles)
create table if not exists public.fisio_bookings (
  id          bigint generated always as identity primary key,
  player_id   bigint references public.players(id) on delete set null,
  date        date not null,
  time        text,
  reason      text,
  wait        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists fisio_player_idx on public.fisio_bookings (player_id);
create index if not exists fisio_date_idx on public.fisio_bookings (date);

-- Roles de usuario: vincula auth.users con su rol y (si es jugador) su fila en players
create table if not exists public.user_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin','player')),
  player_id   bigint references public.players(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- FUNCIONES HELPER
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to authenticated;

create or replace function public.current_player_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select player_id from public.user_roles where user_id = auth.uid();
$$;
grant execute on function public.current_player_id() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rsvp_set_updated_at on public.rsvp;
create trigger rsvp_set_updated_at before update on public.rsvp
  for each row execute function public.set_updated_at();

drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at before update on public.attendance
  for each row execute function public.set_updated_at();

-- Un jugador (no admin) solo puede modificar columnas "editables" de su propia
-- fila en players; cualquier otro cambio se revierte silenciosamente.
-- Los scripts que usan la service_role key (seed, alta de admin) quedan
-- exentos: auth.uid() es NULL en ese contexto y no deben verse afectados.
create or replace function public.players_restrict_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array['nombre','apellido','cat','sub','birth_year','birth_date','pos','pos_short','pos_type','dorsal','phone','emergency_contact','emergency_medical','peso','talla','imc','photo_url'];
  merged jsonb;
begin
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;

  select jsonb_object_agg(
    key,
    case when key = any(allowed) then value else (to_jsonb(old) -> key) end
  )
  into merged
  from jsonb_each(to_jsonb(new));

  return jsonb_populate_record(old, merged);
end;
$$;

drop trigger if exists players_restrict_update_trigger on public.players;
create trigger players_restrict_update_trigger
  before update on public.players
  for each row execute function public.players_restrict_update();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- players ----
alter table public.players enable row level security;

drop policy if exists players_select on public.players;
create policy players_select on public.players
  for select to authenticated using (true);

drop policy if exists players_insert_admin on public.players;
create policy players_insert_admin on public.players
  for insert to authenticated with check (public.is_admin());

drop policy if exists players_update_own_or_admin on public.players;
create policy players_update_own_or_admin on public.players
  for update to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists players_delete_admin on public.players;
create policy players_delete_admin on public.players
  for delete to authenticated using (public.is_admin());

-- ---- player_pins: PIN de acceso, visible solo para el propio jugador o el admin ----
-- Se guarda separado de `players` (que tiene lectura amplia para todo el plantel)
-- para que un jugador no pueda ver el PIN de sus compañeros.
create table if not exists public.player_pins (
  player_id  bigint primary key references public.players(id) on delete cascade,
  pin        text not null,
  updated_at timestamptz not null default now()
);

alter table public.player_pins enable row level security;

drop policy if exists player_pins_select on public.player_pins;
create policy player_pins_select on public.player_pins
  for select to authenticated using (public.is_admin() or player_id = public.current_player_id());

drop policy if exists player_pins_insert_own_or_admin on public.player_pins;
create policy player_pins_insert_own_or_admin on public.player_pins
  for insert to authenticated with check (public.is_admin() or player_id = public.current_player_id());

drop policy if exists player_pins_update_own_or_admin on public.player_pins;
create policy player_pins_update_own_or_admin on public.player_pins
  for update to authenticated
  using (public.is_admin() or player_id = public.current_player_id())
  with check (public.is_admin() or player_id = public.current_player_id());

-- PIN inicial (2026) para jugadores que todavia no tengan fila propia.
-- No pisa los PIN ya cambiados por un jugador.
insert into public.player_pins (player_id, pin)
select id, '2026' from public.players
on conflict (player_id) do nothing;

-- ---- user_roles ----
alter table public.user_roles enable row level security;

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- (insert/update/delete de user_roles se hacen con service_role desde scripts/admin)

-- ---- tablas de lectura amplia / escritura solo-admin ----
do $$
declare
  t text;
  admin_write_tables text[] := array[
    'player_photos', 'gym_marks', 'injuries', 'injury_protocols',
    'practices', 'attendance', 'matches', 'lineups', 'messages',
    'routines', 'shop_items', 'shop_sales'
  ];
begin
  foreach t in array admin_write_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_admin_insert', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_update', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_admin_delete', t
    );
  end loop;
end $$;

-- ---- rsvp: el jugador escribe solo su propia fila ----
alter table public.rsvp enable row level security;

drop policy if exists rsvp_select on public.rsvp;
create policy rsvp_select on public.rsvp
  for select to authenticated using (true);

drop policy if exists rsvp_insert_own_or_admin on public.rsvp;
create policy rsvp_insert_own_or_admin on public.rsvp
  for insert to authenticated with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists rsvp_update_own_or_admin on public.rsvp;
create policy rsvp_update_own_or_admin on public.rsvp
  for update to authenticated
  using (player_id = public.current_player_id() or public.is_admin())
  with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists rsvp_delete_admin on public.rsvp;
create policy rsvp_delete_admin on public.rsvp
  for delete to authenticated using (public.is_admin());

-- ---- gym_checks: el jugador marca su propia asistencia al gym ----
alter table public.gym_checks enable row level security;

drop policy if exists gym_checks_select on public.gym_checks;
create policy gym_checks_select on public.gym_checks
  for select to authenticated using (true);

drop policy if exists gym_checks_insert_own_or_admin on public.gym_checks;
create policy gym_checks_insert_own_or_admin on public.gym_checks
  for insert to authenticated with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists gym_checks_update_own_or_admin on public.gym_checks;
create policy gym_checks_update_own_or_admin on public.gym_checks
  for update to authenticated
  using (player_id = public.current_player_id() or public.is_admin())
  with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists gym_checks_delete_own_or_admin on public.gym_checks;
create policy gym_checks_delete_own_or_admin on public.gym_checks
  for delete to authenticated using (player_id = public.current_player_id() or public.is_admin());

-- ---- fisio_bookings: el jugador reserva/cancela su propio turno ----
alter table public.fisio_bookings enable row level security;

drop policy if exists fisio_select on public.fisio_bookings;
create policy fisio_select on public.fisio_bookings
  for select to authenticated using (true);

drop policy if exists fisio_insert_own_or_admin on public.fisio_bookings;
create policy fisio_insert_own_or_admin on public.fisio_bookings
  for insert to authenticated with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists fisio_update_admin on public.fisio_bookings;
create policy fisio_update_admin on public.fisio_bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists fisio_delete_own_or_admin on public.fisio_bookings;
create policy fisio_delete_own_or_admin on public.fisio_bookings
  for delete to authenticated using (player_id = public.current_player_id() or public.is_admin());

-- ---- admin_docs: el jugador edita su propia documentacion ----
alter table public.admin_docs enable row level security;

drop policy if exists admin_docs_select on public.admin_docs;
create policy admin_docs_select on public.admin_docs
  for select to authenticated using (true);

drop policy if exists admin_docs_insert_own_or_admin on public.admin_docs;
create policy admin_docs_insert_own_or_admin on public.admin_docs
  for insert to authenticated with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists admin_docs_update_own_or_admin on public.admin_docs;
create policy admin_docs_update_own_or_admin on public.admin_docs
  for update to authenticated
  using (player_id = public.current_player_id() or public.is_admin())
  with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists admin_docs_delete_admin on public.admin_docs;
create policy admin_docs_delete_admin on public.admin_docs
  for delete to authenticated using (public.is_admin());

-- ============================================================
-- STORAGE: bucket de fotos de jugadores
-- ============================================================

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

drop policy if exists player_photos_public_read on storage.objects;
create policy player_photos_public_read on storage.objects
  for select using (bucket_id = 'player-photos');

drop policy if exists player_photos_admin_insert on storage.objects;
create policy player_photos_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists player_photos_admin_update on storage.objects;
create policy player_photos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'player-photos' and public.is_admin())
  with check (bucket_id = 'player-photos' and public.is_admin());

drop policy if exists player_photos_admin_delete on storage.objects;
create policy player_photos_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'player-photos' and public.is_admin());

-- Un jugador tambien puede subir/cambiar/borrar su propia foto de perfil,
-- siempre que la guarde dentro de una carpeta "<player_id>/..." en el bucket.
drop policy if exists player_photos_self_insert on storage.objects;
create policy player_photos_self_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_player_id()::text
  );

drop policy if exists player_photos_self_update on storage.objects;
create policy player_photos_self_update on storage.objects
  for update to authenticated
  using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_player_id()::text)
  with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_player_id()::text);

drop policy if exists player_photos_self_delete on storage.objects;
create policy player_photos_self_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'player-photos' and (storage.foldername(name))[1] = public.current_player_id()::text
  );

-- ============================================================
-- STORAGE: bucket de fotos de productos de la Champa Shop
-- ============================================================

insert into storage.buckets (id, name, public)
values ('shop-photos', 'shop-photos', true)
on conflict (id) do nothing;

drop policy if exists shop_photos_public_read on storage.objects;
create policy shop_photos_public_read on storage.objects
  for select using (bucket_id = 'shop-photos');

drop policy if exists shop_photos_admin_insert on storage.objects;
create policy shop_photos_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'shop-photos' and public.is_admin());

drop policy if exists shop_photos_admin_update on storage.objects;
create policy shop_photos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'shop-photos' and public.is_admin())
  with check (bucket_id = 'shop-photos' and public.is_admin());

drop policy if exists shop_photos_admin_delete on storage.objects;
create policy shop_photos_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'shop-photos' and public.is_admin());

-- ============================================================
-- REALTIME: publica cambios en vivo de las tablas mas "compartidas"
-- (asistencia, RSVP, comunicados, alineaciones, turnos de fisio y
-- partidos), para que todos los usuarios conectados vean los cambios
-- de otros sin recargar la app.
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array['attendance','rsvp','messages','lineups','fisio_bookings','matches'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
