-- Migración: ficha completa del jugador (responsable, contacto de
-- emergencia y ficha médica)
-- Pega esto en Supabase: Dashboard > SQL Editor > New query > Run
--
-- Es seguro de correr aunque ya tengas datos reales: no borra ni modifica
-- ninguna fila existente, solo agrega columnas nuevas (todas quedan vacías
-- para los jugadores que ya tenías, hasta que las llenes desde Admin >
-- Editar jugador).

-- Responsable del jugador (quien firma/autoriza, no necesariamente quien
-- tiene la cuenta — familia_email puede ser de cualquiera de los dos).
alter table jugadores add column if not exists responsable_nombre text;
alter table jugadores add column if not exists responsable_parentesco text; -- Padre | Madre | Tutor | Otro
alter table jugadores add column if not exists responsable_telefono text;

-- Contacto de emergencia (puede ser el mismo responsable u otra persona).
alter table jugadores add column if not exists contacto_emergencia_nombre text;
alter table jugadores add column if not exists contacto_emergencia_telefono text;

-- Ficha médica básica.
alter table jugadores add column if not exists tipo_sangre text;
alter table jugadores add column if not exists alergias text;
alter table jugadores add column if not exists condiciones_medicas text;
alter table jugadores add column if not exists seguro_medico text;

-- Nada más que hacer: las políticas de seguridad que ya tienes en
-- jugadores (familia ve lo suyo, admin ve y edita todo) aplican igual a
-- estas columnas nuevas, no hace falta tocar RLS.
