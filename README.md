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
7. **Agrega tu propio correo como administrador** (una sola vez, a mano):
   Table Editor > tabla `administradores` > Insert row > pon tu correo.
   Sin esto, nadie ve el panel de Admin dentro de la app, ni siquiera tú.

Ya no hace falta cargar jugadores, pagos y avisos a mano desde el Table
Editor: eso ahora se hace desde el panel de **Admin** dentro de la propia
app (solo visible para los correos que estén en la tabla `administradores`).
El Table Editor de Supabase sigue sirviendo para revisar datos o corregir
algo puntual.

Si una familia tiene más de un hijo en el club, basta con crear un
jugador por cada uno con el mismo `familia_email`: la app detecta que hay
varios y deja elegir entre ellos arriba de cada pantalla.

### Si ya tenías un proyecto de Supabase de antes

Si ya corriste `schema.sql` en algún momento y tienes datos cargados, NO
vuelvas a correr ese archivo (fallaría porque las tablas ya existen). En
su lugar, corre en orden:

1. `supabase/migracion_admin_reportes.sql` — agrega la tabla de
   administradores, los reportes de pago y los permisos que faltaban.
2. `supabase/migracion_estadisticas.sql` — agrega partidos,
   entrenamientos y la ficha del jugador (reemplaza la hoja de cálculo de
   estadísticas). Si ya corriste el primero antes, con correr solo este
   basta.

Ninguno de los dos toca ni borra nada de lo que ya tienes cargado.

### Estadísticas (partidos, entrenamientos, ficha del jugador)

Desde **Admin > Partidos** registras cada partido (categoría, fecha,
rival, fase, marcador) y agregas a los convocados con sus goles,
asistencias y una nota de actuación 1-10. Desde **Admin > Entrenos**
creas una sesión y marcas Sí/No de asistencia por jugador. "Partidos
jugados" y "% de asistencia" de cada jugador se recalculan solos.

**Admin > Stats** tiene el resumen por categoría, fases y competición, e
historial contra rivales — equivalente a esas mismas hojas del Excel,
solo para el cuerpo técnico (con semáforo verde/rojo comparativo).

La **Ficha del Jugador** (foto, datos, estadísticas e historial de
partidos, sin los colores comparativos) ahora la ven las familias
directamente en la pestaña **Perfil** de la app — ya no hace falta
exportar un PDF y enviarlo aparte.

Para la foto, sigue usando el mismo truco de Google Drive de siempre:
sube la foto ▸ clic derecho ▸ Compartir ▸ 'Cualquier persona con el
enlace' ▸ copia el enlace ▸ conviértelo a enlace directo con
`="https://drive.google.com/uc?export=view&id="&REGEXEXTRACT(A1,"/d/(.*)/")`
en cualquier hoja de cálculo (pegando el enlace compartido en A1) ▸ pega
ese resultado en el campo "Foto" al agregar el jugador desde Admin. Usa
fotos recortadas cuadradas (1:1).

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

- ~~Fase 2: conectar las estadísticas del equipo~~ — ya implementado
  (Admin > Partidos / Entrenos / Stats + Ficha del Jugador en Perfil).
- Fase 3: notificaciones push cuando se publica un aviso nuevo.
- Fase 4: cobro de mensualidad con tarjeta (Azul / CardNet), con
  comisión por transacción — el único paso de esta lista con costo real.

## Estructura del proyecto

```
src/
  components/   Header, BottomNav, Login, FichaJugador, iconos
  views/        Calendario, Pagos, Avisos, Perfil, Admin
  views/admin/  AdminPartidos, AdminEntrenamientos, AdminEstadisticas
  data/         datos de muestra (mockData.ts)
  lib/          cliente de Supabase, hook de jugadores por familia,
                cálculos de estadísticas (estadisticas.ts)
supabase/
  schema.sql                    tablas y reglas de seguridad (proyecto nuevo)
  migracion_admin_reportes.sql  agrega admin + reportes de pago (proyecto existente)
  migracion_estadisticas.sql    agrega partidos, entrenos y ficha del jugador (proyecto existente)
```

