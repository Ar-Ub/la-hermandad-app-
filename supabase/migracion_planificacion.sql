-- Migración: planificación de sesiones de entrenamiento
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Es seguro de correr aunque ya tengas datos reales: no borra ni modifica
-- ninguna fila existente, solo agrega tablas y permisos nuevos.
-- Reemplaza la hoja de cálculo de planificación: banco de ejercicios con
-- validación automática, constructor de sesiones, plantilla imprimible y
-- resúmenes mensual/por ciclo — todo desde el panel de Admin.

create table if not exists reglas_ejercicios (
  id uuid primary key default gen_random_uuid(),
  tipo_tarea text not null,
  componente_fisico text not null,
  jugadores_min integer,
  jugadores_max integer,
  espacio_min numeric,
  espacio_max numeric,
  tiempo_min integer,
  tiempo_max integer,
  series_min integer,
  series_max integer,
  pausa_min integer,
  pausa_max integer,
  densidad_min numeric,
  densidad_max numeric,
  created_at timestamptz default now()
);

create table if not exists banco_ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_tarea text not null,
  enfoque text,
  componente_fisico text not null,
  jugadores integer not null,
  espacio_m2 numeric not null,
  tiempo_min integer not null,
  series integer not null,
  pausa_seg integer,
  diagrama_url text,
  notas text,
  -- id del ejercicio en TacticaFC (otra base de datos Supabase, sin
  -- relación de llave foránea real ya que vive en otro proyecto). Si está
  -- lleno, el diagrama se muestra en vivo desde TacticaFC en vez de
  -- diagrama_url.
  tactica_exercise_id uuid,
  created_at timestamptz default now()
);

-- Por si esta migración ya se había corrido antes de que existiera la
-- columna tactica_exercise_id (integración con TacticaFC agregada después).
alter table banco_ejercicios add column if not exists tactica_exercise_id uuid;

create table if not exists sesiones (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) not null,
  fecha date not null,
  sesion_numero integer not null,
  microciclo text,
  mesociclo text,
  entrenador text,
  hora text,
  lugar text,
  tiempo_total_min integer,
  tipo_sesion text,
  objetivo_tecnico_tactico text,
  objetivo_psicologico text,
  created_at timestamptz default now()
);

create table if not exists sesion_tareas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid references sesiones(id) on delete cascade not null,
  orden integer not null,
  ejercicio_id uuid references banco_ejercicios(id) not null,
  tipo_sesion_override text,
  diagrama_url_override text,
  created_at timestamptz default now()
);

alter table reglas_ejercicios enable row level security;
alter table banco_ejercicios enable row level security;
alter table sesiones enable row level security;
alter table sesion_tareas enable row level security;

drop policy if exists "usuarios autenticados ven reglas_ejercicios" on reglas_ejercicios;
create policy "usuarios autenticados ven reglas_ejercicios"
  on reglas_ejercicios for select using (auth.role() = 'authenticated');
drop policy if exists "admin gestiona reglas_ejercicios" on reglas_ejercicios;
create policy "admin gestiona reglas_ejercicios"
  on reglas_ejercicios for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin actualiza reglas_ejercicios" on reglas_ejercicios;
create policy "admin actualiza reglas_ejercicios"
  on reglas_ejercicios for update using (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin borra reglas_ejercicios" on reglas_ejercicios;
create policy "admin borra reglas_ejercicios"
  on reglas_ejercicios for delete using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "usuarios autenticados ven banco_ejercicios" on banco_ejercicios;
create policy "usuarios autenticados ven banco_ejercicios"
  on banco_ejercicios for select using (auth.role() = 'authenticated');
drop policy if exists "admin gestiona banco_ejercicios" on banco_ejercicios;
create policy "admin gestiona banco_ejercicios"
  on banco_ejercicios for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin actualiza banco_ejercicios" on banco_ejercicios;
create policy "admin actualiza banco_ejercicios"
  on banco_ejercicios for update using (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin borra banco_ejercicios" on banco_ejercicios;
create policy "admin borra banco_ejercicios"
  on banco_ejercicios for delete using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "usuarios autenticados ven sesiones" on sesiones;
create policy "usuarios autenticados ven sesiones"
  on sesiones for select using (auth.role() = 'authenticated');
drop policy if exists "admin gestiona sesiones" on sesiones;
create policy "admin gestiona sesiones"
  on sesiones for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin actualiza sesiones" on sesiones;
create policy "admin actualiza sesiones"
  on sesiones for update using (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin borra sesiones" on sesiones;
create policy "admin borra sesiones"
  on sesiones for delete using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "usuarios autenticados ven sesion_tareas" on sesion_tareas;
create policy "usuarios autenticados ven sesion_tareas"
  on sesion_tareas for select using (auth.role() = 'authenticated');
drop policy if exists "admin gestiona sesion_tareas" on sesion_tareas;
create policy "admin gestiona sesion_tareas"
  on sesion_tareas for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin actualiza sesion_tareas" on sesion_tareas;
create policy "admin actualiza sesion_tareas"
  on sesion_tareas for update using (auth.jwt() ->> 'email' in (select email from administradores));
drop policy if exists "admin borra sesion_tareas" on sesion_tareas;
create policy "admin borra sesion_tareas"
  on sesion_tareas for delete using (auth.jwt() ->> 'email' in (select email from administradores));

-- Opcional: reglas de ejemplo, similares a las de la hoja de cálculo
-- original. Descomenta y corre si quieres arrancar con algo ya cargado
-- en vez de crear las reglas a mano desde Admin > Reglas.
--
-- insert into reglas_ejercicios (tipo_tarea, componente_fisico, jugadores_min, jugadores_max, espacio_min, espacio_max, tiempo_min, tiempo_max, series_min, series_max, pausa_min, pausa_max, densidad_min, densidad_max) values
--   ('Rondos', 'Tensión', 4, 8, 100, 300, 3, 8, 3, 6, 60, 120, 15, 40),
--   ('Ruedas de pase', 'Duración', 6, 12, 200, 500, 8, 15, 2, 4, 90, 180, 25, 60),
--   ('Evoluciones', 'Velocidad', 8, 16, 400, 900, 4, 10, 3, 6, 60, 150, 30, 70);
