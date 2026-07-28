# La Hermandad F.C. — Portal de familias (Fase 1)

Web app para que las familias vean el calendario del equipo, confirmen
asistencia, revisen el estado de la mensualidad y lean avisos del club.
Construida como reemplazo digital de WhatsApp + Google Sheets.

Stack: React + Vite + TypeScript + Tailwind CSS + Supabase (base de datos,
autenticación y hosting de archivos). Todo dentro del plan gratis de ambos
servicios para el tamaño actual del club.

## 1. Correr en tu computadora

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`).
Sin configurar nada más, la app ya funciona con datos de muestra (ver
`src/data/mockData.ts`) para que puedas ver cómo se ve completa.

## 2. Conectar datos reales (Supabase)

1. Crea una cuenta gratis en [supabase.com](https://supabase.com) y un
   proyecto nuevo (elige la región más cercana a República Dominicana,
   ej. US East).
2. En el proyecto, ve a **SQL Editor** y pega el contenido de
   `supabase/schema.sql`, luego dale **Run**. Esto crea las tablas de
   categorías, jugadores, eventos, pagos y avisos.
3. Ve a **Authentication > Providers** y confirma que "Email" esté activo
   con la opción de enlace mágico (no hace falta contraseña).
4. Ve a **Project Settings > API** y copia la "Project URL" y la
   "anon public key".
5. Copia `.env.example` a un archivo nuevo llamado `.env` y pega esos dos
   valores:

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

6. Reinicia `npm run dev`. Ahora el login pedirá un correo real y usará
   las tablas de Supabase en vez de los datos de muestra.

Nota: cargar jugadores, eventos y pagos reales en las tablas todavía se
hace a mano desde el Table Editor de Supabase en esta Fase 1. Conectar
esto automáticamente con el Google Sheets que ya usa el club es la
Fase 2 del plan.

## 3. Publicar la app (gratis)

Recomendado: **Cloudflare Pages**, no Vercel — el plan gratis de Vercel
prohíbe uso comercial, y esta app cobra mensualidad a las familias.

1. Sube este proyecto a un repositorio de GitHub.
2. En [pages.cloudflare.com](https://pages.cloudflare.com), conecta el
   repositorio.
3. Configuración de build:
   - Comando de build: `npm run build`
   - Carpeta de salida: `dist`
4. Agrega las mismas dos variables de entorno (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) en Cloudflare Pages > Settings >
   Environment variables.
5. Cada vez que subas un cambio a GitHub, Cloudflare vuelve a publicar
   la app automáticamente.

Costo total en esta fase: **US$0**, excepto el dominio propio si quieren
uno (ej. lahermandadfc.com, ~US$12-15/año) en vez del subdominio gratis
que da Cloudflare Pages.

## 4. Qué sigue (fases futuras)

- Fase 2: conectar el Google Sheets actual de estadísticas para que
  alimente automáticamente `partidos_jugados` y `asistencia_pct`.
- Fase 3: notificaciones push cuando se publica un aviso nuevo.
- Fase 4: cobro de mensualidad con tarjeta (Azul / CardNet), con
  comisión por transacción — el único paso de esta lista con costo real.

## Estructura del proyecto

```
src/
  components/   Header, BottomNav, Login, iconos
  views/        Calendario, Pagos, Avisos, Perfil
  data/         datos de muestra (mockData.ts)
  lib/          cliente de Supabase
supabase/
  schema.sql    tablas y reglas de seguridad para pegar en Supabase
```

