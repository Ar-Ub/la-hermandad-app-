import { createClient } from '@supabase/supabase-js'

// Cliente de SOLO LECTURA hacia el proyecto Supabase de TacticaFC.
// La Hermandad no escribe nada en TacticaFC: solo lee los ejercicios del
// coach (a través de la vista pública `exercises_publicas`, que ya filtra
// las columnas y filas visibles) para poder elegirlos desde el Banco de
// Ejercicios y mostrar su diagrama sin copiarlo a mano.
//
// La "publishable key" de abajo es del mismo tipo que la anon key: está
// pensada para vivir en código de frontend y ya viene limitada por las
// políticas de RLS y la vista del lado de TacticaFC, así que es seguro
// tenerla aquí (no es una clave secreta).
const TACTICA_FC_SUPABASE_URL = 'https://ntrkfqqrdeuixksbvqxm.supabase.co'
const TACTICA_FC_PUBLISHABLE_KEY = 'sb_publishable_C9KLAAB_pwE5NaOR6XTABA_purEDNRF'

export const tacticaFcClient = createClient(TACTICA_FC_SUPABASE_URL, TACTICA_FC_PUBLISHABLE_KEY)

export type TacticaEjercicio = {
  id: string
  name: string
  thumb: string | null
  elements: unknown
  created_at: string
}

/** Trae los ejercicios del banco de TacticaFC (solo lectura, puede devolver []). */
export async function obtenerEjerciciosTacticaFc(): Promise<TacticaEjercicio[]> {
  const { data, error } = await tacticaFcClient
    .from('exercises_publicas')
    .select('id, name, thumb, elements, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('No se pudo leer TacticaFC:', error.message)
    return []
  }
  return (data ?? []) as TacticaEjercicio[]
}

/** true si el valor de "thumb" se puede usar directo como src de una imagen. */
export function esImagenValida(thumb: string | null | undefined): thumb is string {
  return Boolean(thumb && (thumb.startsWith('data:image') || thumb.startsWith('http')))
}
