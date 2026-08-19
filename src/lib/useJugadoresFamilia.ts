import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export type JugadorFamilia = {
  id: string
  nombre: string
  categoriaId: string | null
  categoria: string
  clubNombre: string | null
  clubLogoUrl: string | null
}

// Una familia puede tener más de un hijo en el club. Este hook trae todos
// los jugadores ligados al correo de la sesión actual (Supabase ya filtra
// esto solo a "los tuyos" via las políticas de seguridad) y deja elegir
// cuál ver en la app.
export function useJugadoresFamilia(autenticado: boolean) {
  const [jugadores, setJugadores] = useState<JugadorFamilia[]>([])
  const [jugadorId, setJugadorId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!supabase || !autenticado) return
    setCargando(true)
    supabase
      .from('jugadores')
      .select('id, nombre, categoria_id, categorias(nombre), clubes(nombre, logo_url)')
      .then(({ data, error }) => {
        if (!error && data) {
          const lista: JugadorFamilia[] = data.map((j: any) => ({
            id: j.id,
            nombre: j.nombre,
            categoriaId: j.categoria_id,
            categoria: j.categorias?.nombre ?? '',
            clubNombre: j.clubes?.nombre ?? null,
            clubLogoUrl: j.clubes?.logo_url ?? null,
          }))
          setJugadores(lista)
          setJugadorId((actual) => actual ?? lista[0]?.id ?? null)
        }
        setCargando(false)
      })
  }, [autenticado])

  const jugadorActual = jugadores.find((j) => j.id === jugadorId) ?? null

  return { jugadores, jugadorActual, jugadorId, setJugadorId, cargando }
}
