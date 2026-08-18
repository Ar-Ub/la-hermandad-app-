import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { jugadorMock, partidosMock, partidoJugadoresMock, asistenciasMock, type Jugador } from '../data/mockData'
import { resumenDeJugador, type Partido, type PartidoJugador, type EntrenamientoAsistencia } from '../lib/estadisticas'
import FichaJugador from '../components/FichaJugador'

type Props = {
  jugadorId?: string | null
}

export default function Perfil({ jugadorId }: Props) {
  const [jugador, setJugador] = useState<Jugador>(jugadorMock)
  const [partidos, setPartidos] = useState<Partido[]>(partidosMock)
  const [partidoJugadores, setPartidoJugadores] = useState<PartidoJugador[]>(partidoJugadoresMock)
  const [asistencias, setAsistencias] = useState<EntrenamientoAsistencia[]>(asistenciasMock)

  useEffect(() => {
    if (!supabase || !jugadorId) return

    supabase
      .from('jugadores')
      .select('*, categorias(nombre)')
      .eq('id', jugadorId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error || !data) return
        let alDia = true
        const { data: pagos } = await supabase!
          .from('pagos')
          .select('estado, fecha_limite')
          .eq('jugador_id', jugadorId)
          .order('fecha_limite', { ascending: false })
          .limit(1)
        if (pagos && pagos.length) alDia = pagos[0].estado === 'pagado'
        setJugador({
          id: data.id,
          nombre: data.nombre,
          categoria: (data as any).categorias?.nombre ?? '',
          posicion: data.posicion ?? '',
          fecha_nacimiento: data.fecha_nacimiento ?? null,
          foto_url: data.foto_url ?? null,
          asistencia_pct: data.asistencia_pct ?? 0,
          partidos_jugados: data.partidos_jugados ?? 0,
          mensualidad_al_dia: alDia,
        })
      })

    supabase
      .from('partido_jugadores')
      .select('id, partido_id, jugador_id, goles, asistencias, actuacion, partidos(id, categoria_id, fecha, rival, fase, goles_favor, goles_contra)')
      .eq('jugador_id', jugadorId)
      .then(({ data }) => {
        if (!data) return
        const partidosDelJugador: Partido[] = data.map((pj: any) => pj.partidos).filter(Boolean)
        const partidoJugadoresDelJugador: PartidoJugador[] = data.map((pj: any) => ({
          id: pj.id,
          partido_id: pj.partido_id,
          jugador_id: pj.jugador_id,
          goles: pj.goles,
          asistencias: pj.asistencias,
          actuacion: pj.actuacion,
        }))
        setPartidos(partidosDelJugador)
        setPartidoJugadores(partidoJugadoresDelJugador)
      })

    supabase
      .from('entrenamiento_asistencias')
      .select('id, entrenamiento_id, jugador_id, asistio')
      .eq('jugador_id', jugadorId)
      .then(({ data }) => {
        if (data) setAsistencias(data as EntrenamientoAsistencia[])
      })
  }, [jugadorId])

  const resumen = resumenDeJugador(jugador.id, partidos, partidoJugadores, asistencias)

  return (
    <div>
      <div className="px-5 pt-4">
        <div
          className={`text-xs rounded-lg px-3 py-2 flex items-center justify-between ${
            jugador.mensualidad_al_dia ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          <span>Mensualidad</span>
          <span className="font-medium">{jugador.mensualidad_al_dia ? 'Al día' : 'Pendiente'}</span>
        </div>
      </div>
      <FichaJugador
        nombre={jugador.nombre}
        categoria={jugador.categoria}
        posicion={jugador.posicion}
        fechaNacimiento={jugador.fecha_nacimiento}
        fotoUrl={jugador.foto_url}
        resumen={resumen}
      />
    </div>
  )
}
