// Datos de muestra que se usan mientras no hay un proyecto de Supabase
// conectado. En cuanto configures VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
// (ver README), la app deberia leer estos mismos datos desde las tablas
// de supabase/schema.sql en vez de este archivo.

export type Evento = {
  id: string
  titulo: string
  fecha: string // ISO date
  hora: string
  lugar: string
  estado: 'confirmado' | 'por_confirmar' | 'pendiente'
}

export type Pago = {
  id: string
  mes: string
  monto: number
  estado: 'pagado' | 'vence' | 'atrasado'
  fecha_limite: string
}

export type Aviso = {
  id: string
  titulo: string
  cuerpo: string
  fecha: string
}

export type Jugador = {
  id: string
  nombre: string
  categoria: string
  posicion: string
  asistencia_pct: number
  partidos_jugados: number
  mensualidad_al_dia: boolean
}

export const eventosMock: Evento[] = [
  { id: '1', titulo: 'Entrenamiento', fecha: '2026-07-28', hora: '6:30 pm', lugar: 'Cancha propia', estado: 'confirmado' },
  { id: '2', titulo: 'Amistoso vs Ébano FC', fecha: '2026-08-02', hora: '4:00 pm', lugar: 'Cancha municipal', estado: 'por_confirmar' },
  { id: '3', titulo: 'Entrenamiento', fecha: '2026-08-05', hora: '6:30 pm', lugar: 'Cancha propia', estado: 'pendiente' },
]

export const pagosMock: Pago[] = [
  { id: '1', mes: 'Julio 2026', monto: 4000, estado: 'pagado', fecha_limite: '2026-07-03' },
  { id: '2', mes: 'Agosto 2026', monto: 4000, estado: 'vence', fecha_limite: '2026-08-05' },
]

export const avisosMock: Aviso[] = [
  { id: '1', titulo: 'Cambio de horario', cuerpo: 'El entrenamiento del viernes se mueve a las 7:00 pm por uso de cancha.', fecha: 'Hace 2 horas' },
  { id: '2', titulo: 'Convocatoria amistoso', cuerpo: 'Lista de convocados para el sábado ya está publicada en Perfil.', fecha: 'Ayer' },
]

export const jugadorMock: Jugador = {
  id: '1',
  nombre: 'Junior Ramírez',
  categoria: 'Sub-13',
  posicion: 'Mediocampista',
  asistencia_pct: 92,
  partidos_jugados: 9,
  mensualidad_al_dia: true,
}
