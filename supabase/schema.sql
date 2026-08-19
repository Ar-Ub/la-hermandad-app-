-- Esquema completo para La Hermandad F.C.
-- Copiar y pegar en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Este archivo es para un proyecto NUEVO desde cero. Si ya corriste una
-- versión anterior de este archivo y ya tienes datos cargados, usa en su
-- lugar supabase/migracion_admin_reportes.sql (no borra nada existente).

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,          -- 'Sub-11', 'Sub-13', 'Sub-15'
  created_at timestamptz default now()
);

create table jugadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  posicion text,
  categoria_id uuid references categorias(id),
  familia_email text not null,   -- correo que usa el padre/madre para entrar
  asistencia_pct numeric default 0,
  partidos_jugados integer default 0,
  created_at timestamptz default now()
);

create table eventos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id), -- null = para todo el club
  titulo text not null,
  fecha date not null,
  hora text,
  lugar text,
  estado text default 'pendiente', -- confirmado | por_confirmar | pendiente
  created_at timestamptz default now()
);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid references jugadores(id),
  mes text not null,             -- 'Julio 2026'
  monto numeric not null,
  estado text default 'vence',   -- pagado | vence | atrasado
  fecha_limite date,
  created_at timestamptz default now()
);

create table avisos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id), -- null = para todo el club
  titulo text not null,
  cuerpo text not null,
  created_at timestamptz default now()
);

-- Administradores: coaches/staff con acceso al panel de Admin dentro de la app.
create table administradores (
  email text primary key
);

-- Reportes de pago: la familia avisa "ya pagué" con su referencia, el
-- coach lo confirma desde el panel de Admin.
create table reportes_pago (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid references jugadores(id) not null,
  mes text not null,
  referencia text,
  nota text,
  estado text default 'pendiente_revision', -- pendiente_revision | confirmado | rechazado
  created_at timestamptz default now()
);

-- Seguridad a nivel de fila: cada familia solo ve los datos de su(s)
-- propio(s) jugador(es) (via su correo), no los de otras familias. Los
-- administradores pueden ver y escribir todo.
alter table categorias enable row level security;
alter table jugadores enable row level security;
alter table pagos enable row level security;
alter table eventos enable row level security;
alter table avisos enable row level security;
alter table administradores enable row level security;
alter table reportes_pago enable row level security;

create policy "usuarios autenticados ven categorias"
  on categorias for select
  using (auth.role() = 'authenticated');

create policy "admin gestiona categorias"
  on categorias for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "familia ve su(s) propio(s) jugador(es)"
  on jugadores for select
  using (familia_email = auth.jwt() ->> 'email');

create policy "admin ve todos los jugadores"
  on jugadores for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin agrega jugadores"
  on jugadores for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza jugadores"
  on jugadores for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "familia ve pagos de su(s) jugador(es)"
  on pagos for select
  using (
    jugador_id in (
      select id from jugadores where familia_email = auth.jwt() ->> 'email'
    )
  );

create policy "admin ve todos los pagos"
  on pagos for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin registra pagos"
  on pagos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza pagos"
  on pagos for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven eventos"
  on eventos for select
  using (auth.role() = 'authenticated');

create policy "admin gestiona eventos"
  on eventos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza eventos"
  on eventos for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven avisos"
  on avisos for select
  using (auth.role() = 'authenticated');

create policy "admin publica avisos"
  on avisos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "cada quien verifica si su propio correo es admin"
  on administradores for select
  using (email = auth.jwt() ->> 'email');

create policy "familia reporta pago de su jugador"
  on reportes_pago for insert
  with check (
    jugador_id in (select id from jugadores where familia_email = auth.jwt() ->> 'email')
  );

create policy "familia ve sus propios reportes"
  on reportes_pago for select
  using (
    jugador_id in (select id from jugadores where familia_email = auth.jwt() ->> 'email')
  );

create policy "admin ve todos los reportes"
  on reportes_pago for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza reportes"
  on reportes_pago for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

-- IMPORTANTE: sin al menos una fila en "administradores", nadie ve el
-- panel de Admin (ni tú). Agrega tu correo manualmente una sola vez:
-- Table Editor > administradores > Insert row > email: tu-correo@ejemplo.com

-- ============================================================
-- Estadísticas: partidos, entrenamientos y ficha del jugador
-- (reemplaza la hoja de cálculo de estadísticas del club)
-- ============================================================

alter table jugadores add column if not exists fecha_nacimiento date;
alter table jugadores add column if not exists foto_url text;

-- Responsable, contacto de emergencia y ficha médica básica (ver
-- supabase/migracion_ficha_completa.sql para el detalle de cada columna).
alter table jugadores add column if not exists responsable_nombre text;
alter table jugadores add column if not exists responsable_parentesco text;
alter table jugadores add column if not exists responsable_telefono text;
alter table jugadores add column if not exists contacto_emergencia_nombre text;
alter table jugadores add column if not exists contacto_emergencia_telefono text;
alter table jugadores add column if not exists tipo_sangre text;
alter table jugadores add column if not exists alergias text;
alter table jugadores add column if not exists condiciones_medicas text;
alter table jugadores add column if not exists seguro_medico text;

-- Un partido por categoría. Los goles del jugador van en partido_jugadores;
-- goles_favor/goles_contra aquí son el marcador final del equipo.
create table partidos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) not null,
  fecha date not null,
  rival text not null,
  fase text not null default 'Amistoso', -- Amistoso | Fase de Grupos | 16vos | 8vos | Cuartos | Semifinal | Final
  goles_favor integer not null default 0,
  goles_contra integer not null default 0,
  created_at timestamptz default now()
);

-- Un jugador convocado a un partido, con sus números individuales.
create table partido_jugadores (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid references partidos(id) on delete cascade not null,
  jugador_id uuid references jugadores(id) not null,
  goles integer not null default 0,
  asistencias integer not null default 0,
  actuacion integer, -- calificación 1-10 del entrenador (opcional)
  created_at timestamptz default now()
);

-- Una sesión de entrenamiento por categoría.
create table entrenamientos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) not null,
  fecha date not null,
  created_at timestamptz default now()
);

-- Asistencia de cada jugador convocado a esa sesión.
create table entrenamiento_asistencias (
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

create policy "usuarios autenticados ven partidos"
  on partidos for select
  using (auth.role() = 'authenticated');

create policy "admin gestiona partidos"
  on partidos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza partidos"
  on partidos for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin borra partidos"
  on partidos for delete
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven partido_jugadores"
  on partido_jugadores for select
  using (auth.role() = 'authenticated');

create policy "admin gestiona partido_jugadores"
  on partido_jugadores for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza partido_jugadores"
  on partido_jugadores for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin borra partido_jugadores"
  on partido_jugadores for delete
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven entrenamientos"
  on entrenamientos for select
  using (auth.role() = 'authenticated');

create policy "admin gestiona entrenamientos"
  on entrenamientos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin borra entrenamientos"
  on entrenamientos for delete
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven entrenamiento_asistencias"
  on entrenamiento_asistencias for select
  using (auth.role() = 'authenticated');

create policy "admin gestiona entrenamiento_asistencias"
  on entrenamiento_asistencias for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza entrenamiento_asistencias"
  on entrenamiento_asistencias for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

-- "Partidos jugados" y "% de asistencia" en la tabla jugadores se
-- recalculan solos cada vez que se registra o borra un partido/asistencia
-- (igual que en la hoja de cálculo, pero automático).
create or replace function recalcular_partidos_jugados() returns trigger as $$
begin
  update jugadores set partidos_jugados = (
    select count(distinct partido_id) from partido_jugadores
    where jugador_id = coalesce(new.jugador_id, old.jugador_id)
  ) where id = coalesce(new.jugador_id, old.jugador_id);
  return null;
end;
$$ language plpgsql security definer;

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

create trigger trg_entrenamiento_asistencias_actualizar
after insert or update or delete on entrenamiento_asistencias
for each row execute function recalcular_asistencia_pct();

-- ============================================================
-- Planificación de sesiones de entrenamiento
-- (reemplaza la hoja de cálculo de planificación del club)
-- ============================================================

-- Rangos permitidos por tipo de tarea + componente físico. El admin los
-- ajusta desde Admin > Reglas si su metodología usa otros números.
create table reglas_ejercicios (
  id uuid primary key default gen_random_uuid(),
  tipo_tarea text not null,        -- 'Rondos', 'Ruedas de pase', 'Evoluciones', etc.
  componente_fisico text not null, -- 'Tensión' | 'Duración' | 'Velocidad' | 'Técnico'
  jugadores_min integer,
  jugadores_max integer,
  espacio_min numeric,             -- m²
  espacio_max numeric,
  tiempo_min integer,               -- minutos por serie
  tiempo_max integer,
  series_min integer,
  series_max integer,
  pausa_min integer,                -- segundos
  pausa_max integer,
  densidad_min numeric,             -- m² por jugador
  densidad_max numeric,
  created_at timestamptz default now()
);

-- Catálogo de ejercicios del club, reutilizable entre categorías.
create table banco_ejercicios (
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
  diagrama_url text,                -- enlace a una imagen, o el diagrama pegado a mano
  notas text,
  tactica_exercise_id uuid,         -- id del ejercicio en TacticaFC, si está vinculado (otro proyecto Supabase)
  created_at timestamptz default now()
);

-- Una sesión de entrenamiento planificada para una categoría.
create table sesiones (
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
  tipo_sesion text,                 -- componente físico del día, o 'Mixto' / 'Técnico (neutro)'
  objetivo_tecnico_tactico text,
  objetivo_psicologico text,
  created_at timestamptz default now()
);

-- Cada tarea (normalmente 3) dentro de una sesión, referenciando un
-- ejercicio del banco. Puede tener su propio tipo de sesión si se quiere
-- validar contra un componente físico distinto al de la sesión general.
create table sesion_tareas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid references sesiones(id) on delete cascade not null,
  orden integer not null,           -- 1, 2, 3...
  ejercicio_id uuid references banco_ejercicios(id) not null,
  tipo_sesion_override text,
  diagrama_url_override text,
  created_at timestamptz default now()
);

alter table reglas_ejercicios enable row level security;
alter table banco_ejercicios enable row level security;
alter table sesiones enable row level security;
alter table sesion_tareas enable row level security;

create policy "usuarios autenticados ven reglas_ejercicios"
  on reglas_ejercicios for select using (auth.role() = 'authenticated');
create policy "admin gestiona reglas_ejercicios"
  on reglas_ejercicios for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin actualiza reglas_ejercicios"
  on reglas_ejercicios for update using (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin borra reglas_ejercicios"
  on reglas_ejercicios for delete using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven banco_ejercicios"
  on banco_ejercicios for select using (auth.role() = 'authenticated');
create policy "admin gestiona banco_ejercicios"
  on banco_ejercicios for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin actualiza banco_ejercicios"
  on banco_ejercicios for update using (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin borra banco_ejercicios"
  on banco_ejercicios for delete using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven sesiones"
  on sesiones for select using (auth.role() = 'authenticated');
create policy "admin gestiona sesiones"
  on sesiones for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin actualiza sesiones"
  on sesiones for update using (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin borra sesiones"
  on sesiones for delete using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "usuarios autenticados ven sesion_tareas"
  on sesion_tareas for select using (auth.role() = 'authenticated');
create policy "admin gestiona sesion_tareas"
  on sesion_tareas for insert with check (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin actualiza sesion_tareas"
  on sesion_tareas for update using (auth.jwt() ->> 'email' in (select email from administradores));
create policy "admin borra sesion_tareas"
  on sesion_tareas for delete using (auth.jwt() ->> 'email' in (select email from administradores));

-- ============================================================
-- Registro público: link para que los padres se inscriban solos
-- (ver supabase/migracion_registro_publico.sql para más detalle)
-- ============================================================

create table solicitudes_registro (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  posicion text,
  categoria_id uuid references categorias(id),
  familia_email text not null,
  fecha_nacimiento date,
  foto_url text,
  responsable_nombre text,
  responsable_parentesco text,
  responsable_telefono text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  tipo_sangre text,
  alergias text,
  condiciones_medicas text,
  seguro_medico text,
  estado text not null default 'pendiente', -- pendiente | aprobada | rechazada
  created_at timestamptz default now()
);

alter table solicitudes_registro enable row level security;

create policy "cualquiera envia una solicitud de registro"
  on solicitudes_registro for insert
  with check (true);

create policy "admin ve las solicitudes"
  on solicitudes_registro for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

create policy "admin actualiza solicitudes"
  on solicitudes_registro for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "publico ve categorias" on categorias;
create policy "publico ve categorias"
  on categorias for select
  using (true);
