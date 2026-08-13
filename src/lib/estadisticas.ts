// Cálculos que antes hacía la hoja de cálculo de estadísticas del club,
// ahora hechos en el navegador a partir de los datos de Supabase (o de
// muestra). Todo esto es lo que alimenta la Ficha del Jugador y las
// pantallas internas de Admin (Resumen por Categoría, Fases y
// Competición, Historial vs Rivales).

export type Partido = {
  id: string
  categoria_id: string
  fecha: string
  rival: string
  fase: string // 'Amistoso' | 'Fase de Grupos' | '16vos' | '8vos' | 'Cuartos' | 'Semifinal' | 'Final'
  goles_favor: number
  goles_contra: number
}

export type PartidoJugador = {
  id: string
  partido_id: string
  jugador_id: string
  goles: number
  asistencias: number
  actuacion: number | null
}

export type Entrenamiento = {
  id: string
  categoria_id: string
  fecha: string
}

export type EntrenamientoAsistencia = {
  id: string
  entrenamiento_id: string
  jugador_id: string
  asistio: boolean
}

export const FASES = ['Amistoso', 'Fase de Grupos', '16vos', '8vos', 'Cuartos', 'Semifinal', 'Final'] as const

export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null
  const nacimiento = new Date(fechaNacimiento + 'T00:00:00')
  if (isNaN(nacimiento.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const aunNoCumple =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
  if (aunNoCumple) edad--
  return edad
}

// --- Ficha del jugador ---

export type ResumenJugador = {
  partidosJugados: number
  goles: number
  asistencias: number
  promedioActuacion: number | null
  entrenamientosConvocado: number
  entrenamientosAsistidos: number
  asistenciaPct: number
  historialPartidos: {
    fecha: string
    rival: string
    fase: string
    resultadoEquipo: string // '2-1'
    golesJugador: number
    asistenciasJugador: number
    actuacion: number | null
  }[]
}

export function resumenDeJugador(
  jugadorId: string,
  partidos: Partido[],
  partidoJugadores: PartidoJugador[],
  entrenamientos: Entrenamiento[],
  asistencias: EntrenamientoAsistencia[]
): ResumenJugador {
  const partidosPorId = new Map(partidos.map((p) => [p.id, p]))
  const misParticipaciones = partidoJugadores.filter((pj) => pj.jugador_id === jugadorId)

  const goles = misParticipaciones.reduce((acc, pj) => acc + pj.goles, 0)
  const asistenciasGoles = misParticipaciones.reduce((acc, pj) => acc + pj.asistencias, 0)
  const actuaciones = misParticipaciones.map((pj) => pj.actuacion).filter((a): a is number => a != null)
  const promedioActuacion = actuaciones.length
    ? Math.round((actuaciones.reduce((a, b) => a + b, 0) / actuaciones.length) * 10) / 10
    : null

  const historialPartidos = misParticipaciones
    .map((pj) => {
      const p = partidosPorId.get(pj.partido_id)
      if (!p) return null
      return {
        fecha: p.fecha,
        rival: p.rival,
        fase: p.fase,
        resultadoEquipo: `${p.goles_favor}-${p.goles_contra}`,
        golesJugador: pj.goles,
        asistenciasJugador: pj.asistencias,
        actuacion: pj.actuacion,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  const misAsistenciasEntreno = asistencias.filter((a) => a.jugador_id === jugadorId)
  const entrenamientosConvocado = misAsistenciasEntreno.length
  const entrenamientosAsistidos = misAsistenciasEntreno.filter((a) => a.asistio).length
  const asistenciaPct = entrenamientosConvocado
    ? Math.round((100 * entrenamientosAsistidos) / entrenamientosConvocado)
    : 0

  return {
    partidosJugados: new Set(misParticipaciones.map((pj) => pj.partido_id)).size,
    goles,
    asistencias: asistenciasGoles,
    promedioActuacion,
    entrenamientosConvocado,
    entrenamientosAsistidos,
    asistenciaPct,
    historialPartidos,
  }
}

// --- Resumen por categoría (uso interno) ---

export type ResumenCategoria = {
  categoriaId: string
  categoriaNombre: string
  partidosJugados: number
  ganados: number
  empatados: number
  perdidos: number
  golesFavor: number
  golesContra: number
  asistenciaPromedioPct: number
}

export function resumenPorCategoria(
  categorias: { id: string; nombre: string }[],
  partidos: Partido[],
  entrenamientos: Entrenamiento[],
  asistencias: EntrenamientoAsistencia[]
): ResumenCategoria[] {
  return categorias.map((cat) => {
    const partidosCat = partidos.filter((p) => p.categoria_id === cat.id)
    let ganados = 0,
      empatados = 0,
      perdidos = 0,
      golesFavor = 0,
      golesContra = 0
    for (const p of partidosCat) {
      golesFavor += p.goles_favor
      golesContra += p.goles_contra
      if (p.goles_favor > p.goles_contra) ganados++
      else if (p.goles_favor < p.goles_contra) perdidos++
      else empatados++
    }

    const entrenamientosCat = new Set(entrenamientos.filter((e) => e.categoria_id === cat.id).map((e) => e.id))
    const asistenciasCat = asistencias.filter((a) => entrenamientosCat.has(a.entrenamiento_id))
    const asistenciaPromedioPct = asistenciasCat.length
      ? Math.round((100 * asistenciasCat.filter((a) => a.asistio).length) / asistenciasCat.length)
      : 0

    return {
      categoriaId: cat.id,
      categoriaNombre: cat.nombre,
      partidosJugados: partidosCat.length,
      ganados,
      empatados,
      perdidos,
      golesFavor,
      golesContra,
      asistenciaPromedioPct,
    }
  })
}

// --- Fases y competición (uso interno) ---

export type ResumenFasesCategoria = {
  categoriaId: string
  categoriaNombre: string
  porFase: { fase: string; partidos: number; promedioGolesFavor: number }[]
  totalPartidos: number
}

export function resumenFasesYCompeticion(
  categorias: { id: string; nombre: string }[],
  partidos: Partido[]
): ResumenFasesCategoria[] {
  return categorias.map((cat) => {
    const partidosCat = partidos.filter((p) => p.categoria_id === cat.id)
    const porFase = FASES.map((fase) => {
      const deEstaFase = partidosCat.filter((p) => p.fase === fase)
      const promedioGolesFavor = deEstaFase.length
        ? Math.round((deEstaFase.reduce((acc, p) => acc + p.goles_favor, 0) / deEstaFase.length) * 10) / 10
        : 0
      return { fase, partidos: deEstaFase.length, promedioGolesFavor }
    }).filter((f) => f.partidos > 0)

    return {
      categoriaId: cat.id,
      categoriaNombre: cat.nombre,
      porFase,
      totalPartidos: partidosCat.length,
    }
  })
}

// --- Historial vs rivales (uso interno) ---

export type HistorialRival = {
  rival: string
  partidosJugados: number
  ganados: number
  empatados: number
  perdidos: number
  golesFavor: number
  golesContra: number
}

export function historialVsRivales(partidos: Partido[]): {
  porRival: HistorialRival[]
  rivalMasEnfrentado: string | null
} {
  const mapa = new Map<string, HistorialRival>()
  for (const p of partidos) {
    const actual = mapa.get(p.rival) ?? {
      rival: p.rival,
      partidosJugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
    }
    actual.partidosJugados++
    actual.golesFavor += p.goles_favor
    actual.golesContra += p.goles_contra
    if (p.goles_favor > p.goles_contra) actual.ganados++
    else if (p.goles_favor < p.goles_contra) actual.perdidos++
    else actual.empatados++
    mapa.set(p.rival, actual)
  }
  const porRival = Array.from(mapa.values()).sort((a, b) => b.partidosJugados - a.partidosJugados)
  return {
    porRival,
    rivalMasEnfrentado: porRival[0]?.rival ?? null,
  }
}
