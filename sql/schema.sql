-- Esquema Supabase para el juego "Adivina el personaje"
-- Ejecutar una vez en el SQL Editor de Supabase.

-- ==== TABLAS ====

create table ciudades (
  id     serial primary key,
  nombre text not null,
  lat    double precision not null,
  lon    double precision not null
);

create table personajes (
  id                   serial primary key,
  nombre               text not null,
  nombres_alternativos text[] not null default '{}'
);

create table hechos (
  id            serial primary key,
  personaje_id  integer not null references personajes(id) on delete cascade,
  ciudad_id     integer not null references ciudades(id)    on delete restrict,
  anio          integer not null,
  actividad     text not null,
  orden         integer not null,
  palabra_clave text not null,
  unique (personaje_id, orden)
);

create table partidas (
  id            bigserial primary key,
  alias         text,
  personaje_id  integer not null references personajes(id),
  acertado      boolean not null,
  puntos        integer not null check (puntos between 0 and 100),
  turnos_usados integer not null check (turnos_usados between 1 and 4),
  fecha         timestamptz not null default now()
);

create table respuestas_partida (
  id              bigserial primary key,
  partida_id      bigint not null references partidas(id) on delete cascade,
  turno           integer not null check (turno between 1 and 4),
  respuesta_texto text,
  acertada        boolean not null default false
);

-- ==== ROW LEVEL SECURITY ====

alter table ciudades           enable row level security;
alter table personajes         enable row level security;
alter table hechos             enable row level security;
alter table partidas           enable row level security;
alter table respuestas_partida enable row level security;

-- Lectura pública de catálogo (personajes / hechos / ciudades)
create policy "ciudades_select_public"   on ciudades   for select using (true);
create policy "personajes_select_public" on personajes for select using (true);
create policy "hechos_select_public"     on hechos     for select using (true);

-- partidas: lectura pública (historial) + inserción pública. Sin update/delete
-- (denegado por defecto al no existir política para esas operaciones).
-- La política de SELECT es también necesaria para poder leer el id devuelto
-- por .insert(...).select().single() al crear una partida.
create policy "partidas_select_public" on partidas for select using (true);
create policy "partidas_insert_public" on partidas for insert with check (true);

-- respuestas_partida: solo inserción pública (no se lee desde el cliente).
create policy "respuestas_insert_public" on respuestas_partida for insert with check (true);
