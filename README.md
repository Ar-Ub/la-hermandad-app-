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
3. `supabase/migracion_planificacion.sql` — agrega Reglas de Ejercicios,
   Banco de Ejercicios, Planificación de sesiones y Resúmenes (reemplaza
   la hoja de cálculo de planificación de entrenamientos). Si ya la
   corriste antes de que existiera el vínculo con TacticaFC, córrela de
   nuevo: solo agrega la columna que falta, no duplica nada.
4. `supabase/migracion_ficha_completa.sql` — agrega responsable, contacto
   de emergencia y ficha médica básica a cada jugador (completa la Ficha
   del Jugador con lo que ya tenías cargado antes con solo nombre/foto).
5. `supabase/migracion_registro_publico.sql` — agrega el registro público
   (los padres se inscriben ellos mismos con un link, sin necesitar
   cuenta).
6. `supabase/migracion_multi_club_fase1.sql` — agrega la base para que en
   el futuro un solo proyecto pueda servir a varios clubes (fase 1 de 3;
   no cambia nada de lo que ves hoy en la app, ver sección "Multi-club"
   más abajo).

Ninguno de los seis toca ni borra nada de lo que ya tienes cargado.

### Estadísticas (partidos, entrenamientos, ficha del jugador)

Desde **Admin > Partidos** registras cada partido (categoría, fecha,
rival, fase, marcador) y agregas a los convocados con sus goles,
asistencias y una nota de actuación 1-10. Desde **Admin > Entrenos**
creas una sesión y marcas Sí/No de asistencia por jugador. "Partidos
jugados" y "% de asistencia" de cada jugador se recalculan solos.

**Admin > Stats** tiene el resumen por categoría, fases y competición, e
historial contra rivales — equivalente a esas mismas hojas del Excel,
solo para el cuerpo técnico (con semáforo verde/rojo comparativo).

La **Ficha del Jugador** (foto, datos, estadísticas, historial de
partidos, responsable/contacto de emergencia y ficha médica básica — sin
los colores comparativos) ahora la ven las familias directamente en la
pestaña **Perfil** de la app — ya no hace falta exportar un PDF y
enviarlo aparte. Desde **Admin > General**, cada jugador tiene un botón
**Editar** para completar o corregir esos datos en cualquier momento
(no solo al agregarlo).

Para la foto, sigue usando el mismo truco de Google Drive de siempre:
sube la foto ▸ clic derecho ▸ Compartir ▸ 'Cualquier persona con el
enlace' ▸ copia el enlace ▸ conviértelo a enlace directo con
`="https://drive.google.com/uc?export=view&id="&REGEXEXTRACT(A1,"/d/(.*)/")`
en cualquier hoja de cálculo (pegando el enlace compartido en A1) ▸ pega
ese resultado en el campo "Foto" al agregar el jugador desde Admin. Usa
fotos recortadas cuadradas (1:1).

### Planificación de sesiones y TacticaFC

Desde **Admin > Reglas** defines los rangos válidos por tipo de tarea y
componente físico. Desde **Admin > Banco** creas ejercicios: si vinculas
uno con un ejercicio de **TacticaFC**, el diagrama se muestra en vivo
(si lo corriges allá, se actualiza aquí solo — no son dos copias
separadas). Desde **Admin > Planificación** armas sesiones de hasta 3
tareas y ves la plantilla imprimible. **Admin > Resúmenes** tiene el
resumen mensual (con meta) y por ciclo.

La conexión con TacticaFC es de solo lectura: La Hermandad nunca escribe
en la base de datos de TacticaFC, solo lee los ejercicios del coach a
través de una vista pública (`exercises_publicas`) que ya está creada en
ese proyecto. Si TacticaFC corre solo en tu computadora (`localhost`)
sigue funcionando igual: en cuanto guardes un ejercicio ahí, aparece acá
— no hace falta que esté publicada en internet para que la conexión
funcione, solo que ambas usen la misma base de datos en la nube.

### Registro público (los padres se inscriben solos)

Desde **Admin > Solicitudes** hay un link (algo como
`tu-app.workers.dev/?registro=1`) que puedes compartir por WhatsApp o
redes. Los padres lo abren sin necesitar cuenta ni contraseña, y llenan
los datos del jugador, del responsable, contacto de emergencia y ficha
médica. Eso NO crea el jugador directo: queda como solicitud pendiente
en **Admin > Solicitudes**, donde revisas cada una y le das **Aprobar**
(crea el jugador real, ya con toda la ficha completa) o **Rechazar**. Así
evitas que cualquiera con el link agregue jugadores fantasma al roster,
y de paso puedes corregir la categoría si el padre se equivocó al elegir.

### Multi-club (para vender la app a otros clubes)

El plan gratis de Supabase solo permite 2 proyectos activos por cuenta,
así que un proyecto separado por cliente no escala gratis. El plan es
que un solo proyecto sirva a varios clubes, separados por `club_id`.
Esto se hace en 3 fases para no arriesgar los datos reales de La
Hermandad:

- **Fase 1 (lista):** tabla `clubes` + columna `club_id` en cada tabla
  existente, todo con un valor por defecto. No cambia nada de lo que ves
  hoy — La Hermandad sigue siendo, en la práctica, el único club.
- **Fase 2 (lista):** los permisos (RLS) ahora exigen que cada fila
  pertenezca a tu club — un admin de un club no puede ver ni tocar datos
  de otro. El link de registro público ahora incluye `&club=tu-slug`
  (Admin > Solicitudes te da el link correcto ya armado), y el
  formulario público muestra el nombre/logo del club correcto según ese
  slug. Para La Hermandad, nada de esto se nota — sigues viendo
  exactamente lo mismo que antes.
- **Fase 3 (lista, parcial):** el nombre y logo dentro de la app ahora
  salen de la tabla `clubes`, no del código. Antes de loguearse (cuando
  todavía no se sabe a qué club perteneces) se muestra la marca de la
  plataforma, **Ciclo Asiste**; después de loguearte, el Header muestra
  el club real (La Hermandad F.C. hoy). Pendiente dentro de esta misma
  fase: colores por club (la columna `color_primario` ya existe pero
  todavía no se usa en la interfaz), y una forma de dar de alta un club
  nuevo sin tocar código.

### Un club nuevo, gratis, sin dominio propio

No hace falta comprar un dominio para vender la app a un segundo club.
Cloudflare da subdominios `*.workers.dev` gratis e ilimitados, uno por
cada proyecto de Workers que crees en tu cuenta — no solo el primero.

Para dar de alta un club nuevo:

1. En Supabase, inserta su fila en `clubes` (nombre, `slug`, logo si
   tiene) y su admin en `administradores`, igual que hoy.
2. En Cloudflare, crea un **proyecto de Workers nuevo** (gratis) conectado
   al mismo repositorio de GitHub. Cada proyecto tiene su propio nombre y
   por lo tanto su propia URL: `nombre-que-elijas.tu-subdominio.workers.dev`.
3. En ese proyecto agrega las variables de entorno de siempre
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, y las de Sheets si
   aplica) más una nueva: `VITE_CLUB_SLUG=el-slug-del-club`. Esto hace que
   la pantalla de antes de loguearse muestre la marca de ese club en vez
   de la genérica de Ciclo Asiste, y que el link de registro público de
   ese proyecto no necesite llevar `?club=slug` en la URL.
4. Comparte la URL de ese proyecto con el club — es 100% independiente en
   apariencia, aunque comparte el mismo código y la misma base de datos
   (separados por `club_id` gracias a las Fases 1 y 2).

Además, el nombre que aparece después del nombre del proyecto en la URL
(ej. `ubannar90` en `la-hermandad-app.ubannar90.workers.dev`) es el
subdominio de tu cuenta de Cloudflare, no de este proyecto en particular.
Se puede cambiar una vez, gratis, desde **Workers & Pages > Your
subdomain > Change** en el dashboard de Cloudflare — aplica a todos tus
proyectos a la vez, así que cualquier link ya compartido con el nombre
viejo hay que reenviarlo.

Comprar un dominio propio (ej. `cicloasiste.com`, ~US$12-15/año) sigue
siendo la opción más profesional a futuro, pero no es necesario para
lanzar ni para dar de alta el segundo, tercer o cuarto club.

## 3. Respaldo automático en Google Sheets (gratis)

Todo lo que se guarda en la app (jugadores, pagos, avisos, partidos,
entrenamientos, planificación) se manda también a un Google Sheet de tu
elección, como respaldo y para poder buscar un jugador y ver su record
completo en la pestaña **Ficha_Jugadores**.

1. Crea un Google Sheet nuevo y vacío.
2. Extensiones > Apps Script, borra el contenido por defecto y pega todo
   el archivo `sheets/Code.gs` de este proyecto.
3. Ícono de engranaje (Project Settings) > Script Properties > Add script
   property: nombre `TOKEN`, valor cualquier clave larga inventada por ti
   (es la que evita que alguien más le escriba a tu Sheet).
4. Deploy > New deployment > tipo "Web app" > Execute as: **Me** > Who
   has access: **Anyone**. Copia la URL que termina en `/exec`.
5. Agrega esa URL y el TOKEN del paso 3 a tu `.env`:

```
VITE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_SHEETS_WEBHOOK_TOKEN=la-clave-que-inventaste
```

6. Agrega las mismas dos variables donde publicaste la app (Cloudflare
   Pages > Settings > Environment variables) y vuelve a desplegar.

Sin estos dos valores la app funciona exactamente igual, solo que sin
mandar copia a Sheets.

## 4. Publicar la app (gratis)

Recomendado: **Cloudflare Pages**, no Vercel — el plan gratis de Vercel
prohíbe uso comercial, y esta app cobra mensualidad a las familias.

1. Sube este proyecto a un repositorio de GitHub.
2. En [pages.cloudflare.com](https://pages.cloudflare.com), conecta el
   repositorio.
3. Configuración de build:
   - Comando de build: `npm run build`
   - Carpeta de salida: `dist`
4. Agrega las variables de entorno (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` y, si usas el respaldo en Sheets,
   `VITE_SHEETS_WEBHOOK_URL` y `VITE_SHEETS_WEBHOOK_TOKEN`) en Cloudflare
   Pages > Settings > Environment variables.
5. Cada vez que subas un cambio a GitHub, Cloudflare vuelve a publicar
   la app automáticamente.

Costo total en esta fase: **US$0**, excepto el dominio propio si quieren
uno (ej. lahermandadfc.com, ~US$12-15/año) en vez del subdominio gratis
que da Cloudflare Pages.

## 5. Qué sigue (fases futuras)

- ~~Fase 2: conectar las estadísticas del equipo~~ — ya implementado
  (Admin > Partidos / Entrenos / Stats + Ficha del Jugador en Perfil).
- Fase 3: notificaciones push cuando se publica un aviso nuevo.
- Fase 4: cobro de mensualidad con tarjeta (Azul / CardNet), con
  comisión por transacción — el único paso de esta lista con costo real.

## Estructura del proyecto

```
src/
  components/   Header, BottomNav, Login, FichaJugador, iconos
  views/        Calendario, Pagos, Avisos, Perfil, Admin, RegistroPublico
  views/admin/  AdminPartidos, AdminEntrenamientos, AdminEstadisticas,
                AdminReglas, AdminBancoEjercicios, AdminPlanificacion,
                AdminResumenes, AdminSolicitudes
  data/         datos de muestra (mockData.ts)
  lib/          cliente de Supabase, cliente de solo lectura hacia
                TacticaFC (tacticaFcClient.ts), respaldo en Sheets
                (sheetsSync.ts), cálculos de estadísticas y de
                planificación (estadisticas.ts, planificacion.ts)
supabase/
  schema.sql                    tablas y reglas de seguridad (proyecto nuevo)
  migracion_admin_reportes.sql  agrega admin + reportes de pago (proyecto existente)
  migracion_estadisticas.sql    agrega partidos, entrenos y ficha del jugador (proyecto existente)
  migracion_planificacion.sql   agrega reglas, banco, sesiones y vínculo con TacticaFC (proyecto existente)
  migracion_ficha_completa.sql  agrega responsable, emergencia y ficha médica (proyecto existente)
  migracion_registro_publico.sql agrega el registro público de padres (proyecto existente)
  migracion_multi_club_fase1.sql agrega la base multi-club (proyecto existente, fase 1 de 3)
  migracion_multi_club_fase2.sql seguridad por club, RLS (proyecto existente, fase 2 de 3)
sheets/
  Code.gs                       Google Apps Script del respaldo automático en Sheets
```

