-- Esquema inicial para La Hermandad F.C.
-- Copiar y pegar en Supabase: Dashboard > SQL Editor > New query > Run

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
  categoria_id uuid references categorias(id),
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

-- Seguridad a nivel de fila: cada familia solo ve los datos de su propio
-- jugador (via su correo), no los de otras familias.
alter table jugadores enable row level security;
alter table pagos enable row level security;
alter table eventos enable row level security;
alter table avisos enable row level security;

create policy "familia ve su propio jugador"
  on jugadores for select
  using (familia_email = auth.jwt() ->> 'email');

create policy "familia ve pagos de su jugador"
  on pagos for select
  using (
    jugador_id in (
      select id from jugadores where familia_email = auth.jwt() ->> 'email'
    )
  );

create policy "usuarios autenticados ven eventos"
  on eventos for select
  using (auth.role() = 'authenticated');

create policy "usuarios autenticados ven avisos"
  on avisos for select
  using (auth.role() = 'authenticated');
