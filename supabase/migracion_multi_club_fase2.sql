-- Migración multi-club — FASE 2: seguridad por club
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Requiere haber corrido antes migracion_multi_club_fase1.sql (necesita
-- la tabla "clubes" y la columna club_id en cada tabla).
--
-- Qué hace: hoy, cualquier admin o familia logueada puede ver TODOS los
-- partidos/entrenos/avisos/etc. de TODOS los clubes (porque los permisos
-- actuales dicen "cualquiera autenticado ve todo", sin filtrar por club).
-- Con un solo club (La Hermandad) eso nunca importó. Pero para vender a
-- más clubes sin mezclar sus datos, cada permiso ahora exige que la fila
-- pertenezca al club del que eres admin o al club de tu(s) hijo(s).
--
-- Para La Hermandad esto es invisible: sigues viendo exactamente lo
-- mismo que antes, porque hoy todo pertenece a un solo club.

-- Función auxiliar: ¿el usuario logueado es admin del club X?
-- security definer para que pueda leer "administradores" sin chocar con
-- los permisos de esa misma tabla (evita recursión).
create or replace function es_admin_de_club(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from administradores
    where email = auth.jwt() ->> 'email' and club_id = p_club_id
  );
$$;

-- Función auxiliar: ¿el usuario logueado pertenece al club X, ya sea
-- como admin o como familia de un jugador de ese club?
create or replace function pertenezco_al_club(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select es_admin_de_club(p_club_id) or exists (
    select 1 from jugadores
    where familia_email = auth.jwt() ->> 'email' and club_id = p_club_id
  );
$$;

-- Aseguramos que cualquier usuario logueado (o público, por si acaso)
-- pueda ejecutar estas funciones — sin esto, las políticas de arriba
-- fallarían con un error de permisos.
grant execute on function es_admin_de_club(uuid) to authenticated, anon;
grant execute on function pertenezco_al_club(uuid) to authenticated, anon;

-- ============ categorias ============
drop policy if exists "usuarios autenticados ven categorias" on categorias;
create policy "usuarios autenticados ven categorias"
  on categorias for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin gestiona categorias" on categorias;
create policy "admin gestiona categorias"
  on categorias for insert
  with check (es_admin_de_club(club_id));

-- ============ jugadores ============
-- (la policy de familia ya está bien: solo ve su(s) propio(s) jugador(es)
-- por correo, sin importar el club — no hace falta tocarla)
drop policy if exists "admin ve todos los jugadores" on jugadores;
create policy "admin ve todos los jugadores"
  on jugadores for select
  using (es_admin_de_club(club_id));

drop policy if exists "admin agrega jugadores" on jugadores;
create policy "admin agrega jugadores"
  on jugadores for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin actualiza jugadores" on jugadores;
create policy "admin actualiza jugadores"
  on jugadores for update
  using (es_admin_de_club(club_id));

-- ============ eventos ============
drop policy if exists "usuarios autenticados ven eventos" on eventos;
create policy "usuarios autenticados ven eventos"
  on eventos for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin gestiona eventos" on eventos;
create policy "admin gestiona eventos"
  on eventos for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin actualiza eventos" on eventos;
create policy "admin actualiza eventos"
  on eventos for update
  using (es_admin_de_club(club_id));

-- ============ pagos ============
-- (la policy de familia ya está bien, vía jugador_id)
drop policy if exists "admin ve todos los pagos" on pagos;
create policy "admin ve todos los pagos"
  on pagos for select
  using (es_admin_de_club(club_id));

drop policy if exists "admin registra pagos" on pagos;
create policy "admin registra pagos"
  on pagos for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin actualiza pagos" on pagos;
create policy "admin actualiza pagos"
  on pagos for update
  using (es_admin_de_club(club_id));

-- ============ avisos ============
drop policy if exists "usuarios autenticados ven avisos" on avisos;
create policy "usuarios autenticados ven avisos"
  on avisos for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin publica avisos" on avisos;
create policy "admin publica avisos"
  on avisos for insert
  with check (es_admin_de_club(club_id));

-- ============ reportes_pago ============
-- (las policies de familia ya están bien, vía jugador_id)
drop policy if exists "admin ve todos los reportes" on reportes_pago;
create policy "admin ve todos los reportes"
  on reportes_pago for select
  using (es_admin_de_club(club_id));

drop policy if exists "admin actualiza reportes" on reportes_pago;
create policy "admin actualiza reportes"
  on reportes_pago for update
  using (es_admin_de_club(club_id));

-- ============ partidos ============
drop policy if exists "usuarios autenticados ven partidos" on partidos;
create policy "usuarios autenticados ven partidos"
  on partidos for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin gestiona partidos" on partidos;
create policy "admin gestiona partidos"
  on partidos for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin actualiza partidos" on partidos;
create policy "admin actualiza partidos"
  on partidos for update
  using (es_admin_de_club(club_id));

drop policy if exists "admin borra partidos" on partidos;
create policy "admin borra partidos"
  on partidos for delete
  using (es_admin_de_club(club_id));

-- ============ partido_jugadores ============
drop policy if exists "usuarios autenticados ven partido_jugadores" on partido_jugadores;
create policy "usuarios autenticados ven partido_jugadores"
  on partido_jugadores for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin gestiona partido_jugadores" on partido_jugadores;
create policy "admin gestiona partido_jugadores"
  on partido_jugadores for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin actualiza partido_jugadores" on partido_jugadores;
create policy "admin actualiza partido_jugadores"
  on partido_jugadores for update
  using (es_admin_de_club(club_id));

drop policy if exists "admin borra partido_jugadores" on partido_jugadores;
create policy "admin borra partido_jugadores"
  on partido_jugadores for delete
  using (es_admin_de_club(club_id));

-- ============ entrenamientos ============
drop policy if exists "usuarios autenticados ven entrenamientos" on entrenamientos;
create policy "usuarios autenticados ven entrenamientos"
  on entrenamientos for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin gestiona entrenamientos" on entrenamientos;
create policy "admin gestiona entrenamientos"
  on entrenamientos for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin borra entrenamientos" on entrenamientos;
create policy "admin borra entrenamientos"
  on entrenamientos for delete
  using (es_admin_de_club(club_id));

-- ============ entrenamiento_asistencias ============
drop policy if exists "usuarios autenticados ven entrenamiento_asistencias" on entrenamiento_asistencias;
create policy "usuarios autenticados ven entrenamiento_asistencias"
  on entrenamiento_asistencias for select
  using (pertenezco_al_club(club_id));

drop policy if exists "admin gestiona entrenamiento_asistencias" on entrenamiento_asistencias;
create policy "admin gestiona entrenamiento_asistencias"
  on entrenamiento_asistencias for insert
  with check (es_admin_de_club(club_id));

drop policy if exists "admin actualiza entrenamiento_asistencias" on entrenamiento_asistencias;
create policy "admin actualiza entrenamiento_asistencias"
  on entrenamiento_asistencias for update
  using (es_admin_de_club(club_id));

-- ============ reglas_ejercicios ============
drop policy if exists "usuarios autenticados ven reglas_ejercicios" on reglas_ejercicios;
create policy "usuarios autenticados ven reglas_ejercicios"
  on reglas_ejercicios for select using (pertenezco_al_club(club_id));
drop policy if exists "admin gestiona reglas_ejercicios" on reglas_ejercicios;
create policy "admin gestiona reglas_ejercicios"
  on reglas_ejercicios for insert with check (es_admin_de_club(club_id));
drop policy if exists "admin actualiza reglas_ejercicios" on reglas_ejercicios;
create policy "admin actualiza reglas_ejercicios"
  on reglas_ejercicios for update using (es_admin_de_club(club_id));
drop policy if exists "admin borra reglas_ejercicios" on reglas_ejercicios;
create policy "admin borra reglas_ejercicios"
  on reglas_ejercicios for delete using (es_admin_de_club(club_id));

-- ============ banco_ejercicios ============
drop policy if exists "usuarios autenticados ven banco_ejercicios" on banco_ejercicios;
create policy "usuarios autenticados ven banco_ejercicios"
  on banco_ejercicios for select using (pertenezco_al_club(club_id));
drop policy if exists "admin gestiona banco_ejercicios" on banco_ejercicios;
create policy "admin gestiona banco_ejercicios"
  on banco_ejercicios for insert with check (es_admin_de_club(club_id));
drop policy if exists "admin actualiza banco_ejercicios" on banco_ejercicios;
create policy "admin actualiza banco_ejercicios"
  on banco_ejercicios for update using (es_admin_de_club(club_id));
drop policy if exists "admin borra banco_ejercicios" on banco_ejercicios;
create policy "admin borra banco_ejercicios"
  on banco_ejercicios for delete using (es_admin_de_club(club_id));

-- ============ sesiones ============
drop policy if exists "usuarios autenticados ven sesiones" on sesiones;
create policy "usuarios autenticados ven sesiones"
  on sesiones for select using (pertenezco_al_club(club_id));
drop policy if exists "admin gestiona sesiones" on sesiones;
create policy "admin gestiona sesiones"
  on sesiones for insert with check (es_admin_de_club(club_id));
drop policy if exists "admin actualiza sesiones" on sesiones;
create policy "admin actualiza sesiones"
  on sesiones for update using (es_admin_de_club(club_id));
drop policy if exists "admin borra sesiones" on sesiones;
create policy "admin borra sesiones"
  on sesiones for delete using (es_admin_de_club(club_id));

-- ============ sesion_tareas ============
drop policy if exists "usuarios autenticados ven sesion_tareas" on sesion_tareas;
create policy "usuarios autenticados ven sesion_tareas"
  on sesion_tareas for select using (pertenezco_al_club(club_id));
drop policy if exists "admin gestiona sesion_tareas" on sesion_tareas;
create policy "admin gestiona sesion_tareas"
  on sesion_tareas for insert with check (es_admin_de_club(club_id));
drop policy if exists "admin actualiza sesion_tareas" on sesion_tareas;
create policy "admin actualiza sesion_tareas"
  on sesion_tareas for update using (es_admin_de_club(club_id));
drop policy if exists "admin borra sesion_tareas" on sesion_tareas;
create policy "admin borra sesion_tareas"
  on sesion_tareas for delete using (es_admin_de_club(club_id));

-- ============ solicitudes_registro ============
-- (el insert público sigue abierto a cualquiera, sin cambios — el
-- formulario público ahora manda su propio club_id según el link usado)
drop policy if exists "admin ve las solicitudes" on solicitudes_registro;
create policy "admin ve las solicitudes"
  on solicitudes_registro for select
  using (es_admin_de_club(club_id));

drop policy if exists "admin actualiza solicitudes" on solicitudes_registro;
create policy "admin actualiza solicitudes"
  on solicitudes_registro for update
  using (es_admin_de_club(club_id));
