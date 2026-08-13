-- Migración: partidos, entrenamientos y ficha del jugador
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Es seguro de correr aunque ya tengas datos reales: no borra ni modifica
-- ninguna fila existente, solo agrega tablas, columnas y permisos nuevos.
-- Reemplaza la hoja de cálculo de estadísticas: a partir de ahora los
-- partidos y entrenamientos se registran desde el panel de Admin dentro
-- de la app, y "partidos jugados" / "% de asistencia" de cada jugador se
-- calculan solos.

alter table jugadores add column if not exists fecha_nacimiento date;
alter table jugadores add column if not exists foto_url text;

create table if not exists partidos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) not null,
  fecha date not null,
  rival text not null,
  fase text not null default 'Amistoso',
  goles_favor integer not null default 0,
  goles_contra integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists partido_jugadores (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid references partidos(id) on delete cascade not null,
  jugador_id uuid references jugadores(id) not null,
  goles integer not null default 0,
  asistencias integer not null default 0,
  actuacion integer,
  created_at timestamptz default now()
);

create table if not exists entrenamientos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) not null,
  fecha date not null,
  created_at timestamptz default now()
);

create table if not exists entrenamiento_asistencias (
  id uuid primary key default gen_random_uuid(),
  entrenamiento_id uuid references entrenamientos(id) on delete cascade not null,
  jugador_id uuid references jugadores(id) not null,
  asistio boolean not null default true,
  created_at timestamptz default now()
);

alter table partidos enable row level security;
alter table partido_jugadores enable row level security;
alter table entrenamientos enable row level security;
alter table entrenamiento_asistencias enable row level security;

drop policy if exists "usuarios autenticados ven partidos" on partidos;
create policy "usuarios autenticados ven partidos"
  on partidos for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin gestiona partidos" on partidos;
create policy "admin gestiona partidos"
  on partidos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza partidos" on partidos;
create policy "admin actualiza partidos"
  on partidos for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin borra partidos" on partidos;
create policy "admin borra partidos"
  on partidos for delete
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "usuarios autenticados ven partido_jugadores" on partido_jugadores;
create policy "usuarios autenticados ven partido_jugadores"
  on partido_jugadores for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin gestiona partido_jugadores" on partido_jugadores;
create policy "admin gestiona partido_jugadores"
  on partido_jugadores for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza partido_jugadores" on partido_jugadores;
create policy "admin actualiza partido_jugadores"
  on partido_jugadores for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin borra partido_jugadores" on partido_jugadores;
create policy "admin borra partido_jugadores"
  on partido_jugadores for delete
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "usuarios autenticados ven entrenamientos" on entrenamientos;
create policy "usuarios autenticados ven entrenamientos"
  on entrenamientos for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin gestiona entrenamientos" on entrenamientos;
create policy "admin gestiona entrenamientos"
  on entrenamientos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin borra entrenamientos" on entrenamientos;
create policy "admin borra entrenamientos"
  on entrenamientos for delete
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "usuarios autenticados ven entrenamiento_asistencias" on entrenamiento_asistencias;
create policy "usuarios autenticados ven entrenamiento_asistencias"
  on entrenamiento_asistencias for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin gestiona entrenamiento_asistencias" on entrenamiento_asistencias;
create policy "admin gestiona entrenamiento_asistencias"
  on entrenamiento_asistencias for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza entrenamiento_asistencias" on entrenamiento_asistencias;
create policy "admin actualiza entrenamiento_asistencias"
  on entrenamiento_asistencias for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

create or replace function recalcular_partidos_jugados() returns trigger as $$
begin
  update jugadores set partidos_jugados = (
    select count(distinct partido_id) from partido_jugadores
    where jugador_id = coalesce(new.jugador_id, old.jugador_id)
  ) where id = coalesce(new.jugador_id, old.jugador_id);
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_partido_jugadores_actualizar on partido_jugadores;
create trigger trg_partido_jugadores_actualizar
after insert or update or delete on partido_jugadores
for each row execute function recalcular_partidos_jugados();

create or replace function recalcular_asistencia_pct() returns trigger as $$
declare
  v_jugador_id uuid := coalesce(new.jugador_id, old.jugador_id);
  v_total integer;
  v_presentes integer;
begin
  select count(*), count(*) filter (where asistio) into v_total, v_presentes
  from entrenamiento_asistencias where jugador_id = v_jugador_id;
  update jugadores set asistencia_pct = case when v_total = 0 then 0 else round(100.0 * v_presentes / v_total) end
  where id = v_jugador_id;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_entrenamiento_asistencias_actualizar on entrenamiento_asistencias;
create trigger trg_entrenamiento_asistencias_actualizar
after insert or update or delete on entrenamiento_asistencias
for each row execute function recalcular_asistencia_pct();

-- Ya puedes ir a la app > Admin > pestaña "Partidos" y "Entrenamientos"
-- para empezar a registrar datos reales, y a "Estadísticas" para ver los
-- resúmenes internos (equivalentes a las hojas "Resumen por Categoría",
-- "Fases y Competición" e "Historial vs Rivales").
