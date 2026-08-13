-- Migración: panel de administrador + reportes de pago de familias
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Es seguro de correr aunque ya tengas un proyecto con datos reales: no
-- borra ni modifica ninguna fila existente, solo agrega tablas y permisos
-- nuevos. Usa este archivo SOLO si ya corriste schema.sql antes (proyecto
-- ya existente). Para un proyecto nuevo desde cero, usa schema.sql directo.

-- 1) Tabla de administradores (coaches/staff con acceso al panel de Admin)
create table if not exists administradores (
  email text primary key
);
alter table administradores enable row level security;

drop policy if exists "cada quien verifica si su propio correo es admin" on administradores;
create policy "cada quien verifica si su propio correo es admin"
  on administradores for select
  using (email = auth.jwt() ->> 'email');

-- 2) Seguridad de escritura: solo administradores pueden agregar/editar
--    jugadores, pagos, avisos y eventos. También les damos visibilidad
--    completa (antes solo veían "sus propios" jugadores/pagos por error).
drop policy if exists "admin ve todos los jugadores" on jugadores;
create policy "admin ve todos los jugadores"
  on jugadores for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin agrega jugadores" on jugadores;
create policy "admin agrega jugadores"
  on jugadores for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza jugadores" on jugadores;
create policy "admin actualiza jugadores"
  on jugadores for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin ve todos los pagos" on pagos;
create policy "admin ve todos los pagos"
  on pagos for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin registra pagos" on pagos;
create policy "admin registra pagos"
  on pagos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza pagos" on pagos;
create policy "admin actualiza pagos"
  on pagos for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin publica avisos" on avisos;
create policy "admin publica avisos"
  on avisos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin gestiona eventos" on eventos;
create policy "admin gestiona eventos"
  on eventos for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza eventos" on eventos;
create policy "admin actualiza eventos"
  on eventos for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

-- 3) La tabla de categorías no tenía seguridad activada (quedaba abierta
--    a cualquiera con la clave pública, sin necesidad de estar logueado).
--    La protegemos igual que las demás.
alter table categorias enable row level security;

drop policy if exists "usuarios autenticados ven categorias" on categorias;
create policy "usuarios autenticados ven categorias"
  on categorias for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin gestiona categorias" on categorias;
create policy "admin gestiona categorias"
  on categorias for insert
  with check (auth.jwt() ->> 'email' in (select email from administradores));

-- 4) Reportes de pago: la familia sube "ya pagué, aquí está mi referencia"
--    y el coach lo confirma desde el panel de Admin.
create table if not exists reportes_pago (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid references jugadores(id) not null,
  mes text not null,
  referencia text,
  nota text,
  estado text default 'pendiente_revision', -- pendiente_revision | confirmado | rechazado
  created_at timestamptz default now()
);
alter table reportes_pago enable row level security;

drop policy if exists "familia reporta pago de su jugador" on reportes_pago;
create policy "familia reporta pago de su jugador"
  on reportes_pago for insert
  with check (
    jugador_id in (select id from jugadores where familia_email = auth.jwt() ->> 'email')
  );

drop policy if exists "familia ve sus propios reportes" on reportes_pago;
create policy "familia ve sus propios reportes"
  on reportes_pago for select
  using (
    jugador_id in (select id from jugadores where familia_email = auth.jwt() ->> 'email')
  );

drop policy if exists "admin ve todos los reportes" on reportes_pago;
create policy "admin ve todos los reportes"
  on reportes_pago for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza reportes" on reportes_pago;
create policy "admin actualiza reportes"
  on reportes_pago for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

-- 5) IMPORTANTE — primer administrador:
-- La tabla "administradores" empieza vacía. Sin al menos una fila ahí,
-- NADIE ve el panel de Admin (ni tú). Agrega tu propio correo manualmente
-- una sola vez: Table Editor > administradores > Insert row >
-- email: tu-correo@ejemplo.com
