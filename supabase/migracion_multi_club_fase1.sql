-- Migración multi-club — FASE 1: estructura nueva, sin romper nada
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Objetivo de esta fase: agregar la tabla "clubes" y una columna club_id
-- a cada tabla existente, para que en el futuro una sola base de datos
-- pueda servir a varios clubes (necesario porque el plan gratis de
-- Supabase solo permite 2 proyectos activos — un proyecto por club no
-- escala gratis).
--
-- Es 100% seguro de correr ahora mismo: no cambia ningún permiso (RLS)
-- todavía, no cambia ninguna pantalla de la app, y La Hermandad sigue
-- funcionando exactamente igual que hoy. Cada columna club_id nueva tiene
-- un valor por default (el id de La Hermandad), así que todas tus filas
-- existentes quedan asignadas a su club automáticamente, sin tocar nada
-- a mano.
--
-- Las fases 2 y 3 (que sí cambian permisos y pantallas para que cada
-- club solo vea lo suyo, y para poder crear clubes nuevos desde un
-- formulario) vienen en migraciones separadas más adelante.

create table if not exists clubes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,        -- usado en el link público, ej. .../?registro=1&club=la-hermandad
  logo_url text,
  color_primario text,              -- hex, ej. '#0B1B3B' — para marca configurable más adelante
  created_at timestamptz default now()
);

-- El club "La Hermandad F.C." con un id fijo, para poder usarlo como
-- default en todas las columnas club_id de abajo sin depender de una
-- subconsulta.
insert into clubes (id, nombre, slug, color_primario)
values ('a1a2a3a4-0000-4000-8000-000000000001', 'La Hermandad F.C.', 'la-hermandad', '#0B1B3B')
on conflict (id) do nothing;

alter table categorias add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table jugadores add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table eventos add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table pagos add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table avisos add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table administradores add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table reportes_pago add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table partidos add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table partido_jugadores add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table entrenamientos add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table entrenamiento_asistencias add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table reglas_ejercicios add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table banco_ejercicios add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table sesiones add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table sesion_tareas add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';
alter table solicitudes_registro add column if not exists club_id uuid references clubes(id) not null default 'a1a2a3a4-0000-4000-8000-000000000001';

-- administradores hoy tiene "email" como llave primaria única. La
-- cambiamos a (email, club_id) para que, en el futuro, la misma persona
-- pueda administrar más de un club sin chocar. Seguro de correr: hoy
-- solo tienes un correo ahí, no hay riesgo de duplicados.
alter table administradores drop constraint if exists administradores_pkey;
alter table administradores add primary key (email, club_id);

-- Lectura pública de la tabla clubes (necesaria para que el formulario
-- público de registro, sin login, pueda mostrar el nombre/logo del club
-- correcto según el link que se comparta).
alter table clubes enable row level security;
drop policy if exists "publico ve clubes" on clubes;
create policy "publico ve clubes"
  on clubes for select
  using (true);
