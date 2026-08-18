// Lógica de planificación de sesiones de entrenamiento.
// Reemplaza las fórmulas de la hoja de cálculo "Planificación de sesiones
// de entrenamiento": cálculo de densidad y validación de ejercicios contra
// los rangos definidos en Reglas de Ejercicios.

export type ReglaEjercicio = {
  id: string
  tipo_tarea: string
  componente_fisico: string
  jugadores_min: number | null
  jugadores_max: number | null
  espacio_min: number | null
  espacio_max: number | null
  tiempo_min: number | null
  tiempo_max: number | null
  series_min: number | null
  series_max: number | null
  pausa_min: number | null
  pausa_max: number | null
  densidad_min: number | null
  densidad_max: number | null
}

export type BancoEjercicio = {
  id: string
  nombre: string
  tipo_tarea: string
  enfoque: string | null
  componente_fisico: string
  jugadores: number
  espacio_m2: number
  tiempo_min: number
  series: number
  pausa_seg: number | null
  diagrama_url: string | null
  notas: string | null
  tactica_exercise_id: string | null
}

export type Sesion = {
  id: string
  categoria_id: string
  fecha: string
  sesion_numero: number
  microciclo: string | null
  mesociclo: string | null
  entrenador: string | null
  hora: string | null
  lugar: string | null
  tiempo_total_min: number | null
  tipo_sesion: string | null
  objetivo_tecnico_tactico: string | null
  objetivo_psicologico: string | null
}

export type SesionTarea = {
  id: string
  sesion_id: string
  orden: number
  ejercicio_id: string
  tipo_sesion_override: string | null
  diagrama_url_override: string | null
}

// Tipos de sesión que no se validan contra las reglas (son de propósito
// general y no siguen un patrón fijo de jugadores/espacio/tiempo).
export const TIPOS_SIN_VALIDACION = ['Mixto', 'Técnico (neutro)']

export function calcularDensidad(espacioM2: number, jugadores: number): number | null {
  if (!jugadores) return null
  return Math.round((espacioM2 / jugadores) * 100) / 100
}

export type ResultadoValidacion = {
  ok: boolean
  sinRegla: boolean
  avisos: string[]
}

function fueraDeRango(valor: number | null | undefined, min: number | null, max: number | null): boolean {
  if (valor == null) return false
  if (min != null && valor < min) return true
  if (max != null && valor > max) return true
  return false
}

/**
 * Valida un ejercicio del banco contra la regla que le corresponde
 * (misma tipo_tarea + componente_fisico). Si no existe una regla para esa
 * combinación, se marca sinRegla=true y ok=true (no hay con qué comparar).
 */
export function validarEjercicio(
  ejercicio: Pick<BancoEjercicio, 'tipo_tarea' | 'componente_fisico' | 'jugadores' | 'espacio_m2' | 'tiempo_min' | 'series' | 'pausa_seg'>,
  reglas: ReglaEjercicio[]
): ResultadoValidacion {
  const regla = reglas.find(
    (r) => r.tipo_tarea === ejercicio.tipo_tarea && r.componente_fisico === ejercicio.componente_fisico
  )
  if (!regla) {
    return { ok: true, sinRegla: true, avisos: [] }
  }

  const avisos: string[] = []
  const densidad = calcularDensidad(ejercicio.espacio_m2, ejercicio.jugadores)

  if (fueraDeRango(ejercicio.jugadores, regla.jugadores_min, regla.jugadores_max)) {
    avisos.push(`Jugadores fuera de rango (${regla.jugadores_min ?? '—'}–${regla.jugadores_max ?? '—'})`)
  }
  if (fueraDeRango(ejercicio.espacio_m2, regla.espacio_min, regla.espacio_max)) {
    avisos.push(`Espacio fuera de rango (${regla.espacio_min ?? '—'}–${regla.espacio_max ?? '—'} m²)`)
  }
  if (fueraDeRango(ejercicio.tiempo_min, regla.tiempo_min, regla.tiempo_max)) {
    avisos.push(`Tiempo fuera de rango (${regla.tiempo_min ?? '—'}–${regla.tiempo_max ?? '—'} min)`)
  }
  if (fueraDeRango(ejercicio.series, regla.series_min, regla.series_max)) {
    avisos.push(`Series fuera de rango (${regla.series_min ?? '—'}–${regla.series_max ?? '—'})`)
  }
  if (fueraDeRango(ejercicio.pausa_seg, regla.pausa_min, regla.pausa_max)) {
    avisos.push(`Pausa fuera de rango (${regla.pausa_min ?? '—'}–${regla.pausa_max ?? '—'} seg)`)
  }
  if (fueraDeRango(densidad, regla.densidad_min, regla.densidad_max)) {
    avisos.push(`Densidad fuera de rango (${regla.densidad_min ?? '—'}–${regla.densidad_max ?? '—'})`)
  }

  return { ok: avisos.length === 0, sinRegla: false, avisos }
}

/** El tipo de sesión "efectivo" de una tarea: el override si existe, si no el de la sesión. */
export function resolverTipoSesion(tarea: Pick<SesionTarea, 'tipo_sesion_override'>, sesion: Pick<Sesion, 'tipo_sesion'>): string | null {
  return tarea.tipo_sesion_override || sesion.tipo_sesion
}

/**
 * Valida una tarea dentro de una sesión: resuelve su tipo efectivo y, si no
 * es un tipo exento (Mixto / Técnico neutro), valida el ejercicio elegido
 * contra las reglas usando ese tipo en vez del tipo_tarea original del
 * ejercicio (para reflejar cómo se está usando en esta sesión concreta).
 */
export function validarTarea(
  tarea: Pick<SesionTarea, 'tipo_sesion_override'>,
  ejercicio: BancoEjercicio,
  sesion: Pick<Sesion, 'tipo_sesion'>,
  reglas: ReglaEjercicio[]
): ResultadoValidacion {
  const tipoEfectivo = resolverTipoSesion(tarea, sesion)
  if (!tipoEfectivo || TIPOS_SIN_VALIDACION.includes(tipoEfectivo)) {
    return { ok: true, sinRegla: true, avisos: [] }
  }
  return validarEjercicio({ ...ejercicio, tipo_tarea: tipoEfectivo }, reglas)
}

/** URL de diagrama efectiva de una tarea: el override si existe, si no el del ejercicio. */
export function resolverDiagramaUrl(tarea: Pick<SesionTarea, 'diagrama_url_override'>, ejercicio: Pick<BancoEjercicio, 'diagrama_url'>): string | null {
  return tarea.diagrama_url_override || ejercicio.diagrama_url
}

/**
 * Diagrama efectivo considerando también el vínculo en vivo con TacticaFC:
 * override manual > diagrama actual en TacticaFC (si el ejercicio está
 * vinculado y todavía existe allá) > diagrama pegado a mano en el ejercicio.
 * `tacticaThumbPorId` es un mapa id de TacticaFC -> thumb, obtenido en vivo.
 */
export function resolverDiagramaEfectivo(
  tarea: Pick<SesionTarea, 'diagrama_url_override'>,
  ejercicio: Pick<BancoEjercicio, 'diagrama_url' | 'tactica_exercise_id'>,
  tacticaThumbPorId: Map<string, string | null>
): string | null {
  if (tarea.diagrama_url_override) return tarea.diagrama_url_override
  if (ejercicio.tactica_exercise_id && tacticaThumbPorId.has(ejercicio.tactica_exercise_id)) {
    return tacticaThumbPorId.get(ejercicio.tactica_exercise_id) ?? null
  }
  return ejercicio.diagrama_url
}
