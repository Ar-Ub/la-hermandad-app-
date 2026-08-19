-- Migración: registro público (link para que los padres se inscriban solos)
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Es seguro de correr aunque ya tengas datos reales: no borra ni modifica
-- ninguna fila existente, solo agrega una tabla nueva y un permiso de
-- lectura pública sobre categorías (los nombres de categoría, ej.
-- "Sub-13", no son datos sensibles).
--
-- Cómo funciona: los padres llenan un formulario público (sin necesidad de
-- cuenta ni login) con los datos del jugador, del responsable y la ficha
-- médica. Eso NO crea el jugador directo — queda en "solicitudes_registro"
-- como pendiente, y el club lo revisa y aprueba desde Admin > Solicitudes
-- antes de que aparezca como jugador real. Así evitas que cualquiera con
-- el link cree jugadores fantasma directo en tu roster, y de paso puedes
-- corregir la categoría si el padre se equivocó.

create table if not exists solicitudes_registro (
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

-- Cualquiera con el link puede enviar una solicitud (no requiere login).
drop policy if exists "cualquiera envia una solicitud de registro" on solicitudes_registro;
create policy "cualquiera envia una solicitud de registro"
  on solicitudes_registro for insert
  with check (true);

-- Solo el club (admin) puede ver y procesar las solicitudes recibidas.
drop policy if exists "admin ve las solicitudes" on solicitudes_registro;
create policy "admin ve las solicitudes"
  on solicitudes_registro for select
  using (auth.jwt() ->> 'email' in (select email from administradores));

drop policy if exists "admin actualiza solicitudes" on solicitudes_registro;
create policy "admin actualiza solicitudes"
  on solicitudes_registro for update
  using (auth.jwt() ->> 'email' in (select email from administradores));

-- El formulario público necesita poder mostrar la lista de categorías
-- (ej. "Sub-13", "Sub-15") sin que el padre tenga que iniciar sesión.
drop policy if exists "publico ve categorias" on categorias;
create policy "publico ve categorias"
  on categorias for select
  using (true);
