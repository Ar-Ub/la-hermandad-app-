// Datos de muestra que se usan mientras no hay un proyecto de Supabase
// conectado. En cuanto configures VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
// (ver README), la app deberia leer estos mismos datos desde las tablas
// de supabase/schema.sql en vez de este archivo.
import type { Partido, PartidoJugador, EntrenamientoAsistencia } from '../lib/estadisticas'

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
  fecha_nacimiento?: string | null
  foto_url?: string | null
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
  fecha_nacimiento: '2013-04-12',
  foto_url: null,
  asistencia_pct: 92,
  partidos_jugados: 9,
  mensualidad_al_dia: true,
}

// Datos de muestra para la Ficha del Jugador (equivalente a la hoja de
// estadísticas). Solo cubren a jugadorMock, para que la demo se vea completa.
export const partidosMock: Partido[] = [
  { id: 'p1', categoria_id: 'c1', fecha: '2026-06-14', rival: 'Ébano FC', fase: 'Amistoso', goles_favor: 3, goles_contra: 1 },
  { id: 'p2', categoria_id: 'c1', fecha: '2026-06-28', rival: 'Atlético Cibao', fase: 'Fase de Grupos', goles_favor: 2, goles_contra: 2 },
  { id: 'p3', categoria_id: 'c1', fecha: '2026-07-12', rival: 'Deportivo Santiago', fase: 'Fase de Grupos', goles_favor: 1, goles_contra: 0 },
]

export const partidoJugadoresMock: PartidoJugador[] = [
  { id: 'pj1', partido_id: 'p1', jugador_id: '1', goles: 1, asistencias: 1, actuacion: 8 },
  { id: 'pj2', partido_id: 'p2', jugador_id: '1', goles: 0, asistencias: 2, actuacion: 7 },
  { id: 'pj3', partido_id: 'p3', jugador_id: '1', goles: 1, asistencias: 0, actuacion: 9 },
]

export const asistenciasMock: EntrenamientoAsistencia[] = [
  { id: 'a1', entrenamiento_id: 'e1', jugador_id: '1', asistio: true },
  { id: 'a2', entrenamiento_id: 'e2', jugador_id: '1', asistio: true },
  { id: 'a3', entrenamiento_id: 'e3', jugador_id: '1', asistio: false },
]
