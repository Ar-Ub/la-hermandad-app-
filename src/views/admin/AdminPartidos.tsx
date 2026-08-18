import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { FASES, type Partido, type PartidoJugador } from '../../lib/estadisticas'
import { sincronizarFila, eliminarFilaSheets } from '../../lib/sheetsSync'

type Categoria = { id: string; nombre: string }
type JugadorBasico = { id: string; nombre: string; categoria_id: string | null }

type Props = {
  categorias: Categoria[]
  jugadores: JugadorBasico[]
  partidos: Partido[]
  partidoJugadores: PartidoJugador[]
  onRecargar: () => void
  avisar: (texto: string) => void
}

export default function AdminPartidos({ categorias, jugadores, partidos, partidoJugadores, onRecargar, avisar }: Props) {
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<string | null>(null)

  async function crearPartido(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const { data, error } = await supabase
      .from('partidos')
      .insert({
        categoria_id: fd.get('categoria_id'),
        fecha: fd.get('fecha'),
        rival: fd.get('rival'),
        fase: fd.get('fase'),
        goles_favor: Number(fd.get('goles_favor')),
        goles_contra: Number(fd.get('goles_contra')),
      })
      .select()
      .single()
    avisar(error ? 'Error: ' + error.message : 'Partido registrado')
    if (!error) {
      if (data) sincronizarFila('partidos', data)
      form.reset()
      onRecargar()
    }
  }

  async function borrarPartido(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('partidos').delete().eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Partido eliminado')
    if (!error) {
      eliminarFilaSheets('partidos', id)
      if (partidoSeleccionado === id) setPartidoSeleccionado(null)
      onRecargar()
    }
  }

  async function agregarConvocado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase || !partidoSeleccionado) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const { data, error } = await supabase
      .from('partido_jugadores')
      .insert({
        partido_id: partidoSeleccionado,
        jugador_id: fd.get('jugador_id'),
        goles: Number(fd.get('goles') || 0),
        asistencias: Number(fd.get('asistencias') || 0),
        actuacion: fd.get('actuacion') ? Number(fd.get('actuacion')) : null,
      })
      .select()
      .single()
    avisar(error ? 'Error: ' + error.message : 'Convocado agregado')
    if (!error) {
      if (data) sincronizarFila('partido_jugadores', data)
      form.reset()
      onRecargar()
    }
  }

  async function quitarConvocado(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('partido_jugadores').delete().eq('id', id)
    if (!error) {
      eliminarFilaSheets('partido_jugadores', id)
      onRecargar()
    } else avisar('Error: ' + error.message)
  }

  const partido = partidos.find((p) => p.id === partidoSeleccionado) ?? null
  const convocadosDelPartido = partidoJugadores.filter((pj) => pj.partido_id === partidoSeleccionado)
  const jugadoresDeLaCategoria = partido ? jugadores.filter((j) => j.categoria_id === partido.categoria_id) : []
  const jugadoresPorId = new Map(jugadores.map((j) => [j.id, j.nombre]))
  const categoriasPorId = new Map(categorias.map((c) => [c.id, c.nombre]))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Partidos registrados ({partidos.length})</p>
        <div className="flex flex-col gap-1.5 mb-3 max-h-56 overflow-y-auto">
          {partidos.length === 0 && <p className="text-xs text-gray-400">Todavía no hay partidos registrados.</p>}
          {partidos.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setPartidoSeleccionado(p.id === partidoSeleccionado ? null : p.id)}
                  className="text-left flex-1 min-w-0"
                >
                  <p className="font-medium truncate">
                    {p.fecha} · {categoriasPorId.get(p.categoria_id) ?? ''} vs {p.rival}
                  </p>
                  <p className="text-gray-500 truncate">
                    {p.fase} · {p.goles_favor}-{p.goles_contra}
                  </p>
                </button>
                <button onClick={() => borrarPartido(p.id)} className="shrink-0 text-red-600 font-medium">
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={crearPartido} className="flex flex-col gap-2">
          <select name="categoria_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Categoría...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input name="fecha" type="date" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="rival" required placeholder="Rival" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select name="fase" required defaultValue="Amistoso" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {FASES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <input
              name="goles_favor"
              type="number"
              required
              min={0}
              defaultValue={0}
              placeholder="Goles del equipo"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-400">–</span>
            <input
              name="goles_contra"
              type="number"
              required
              min={0}
              defaultValue={0}
              placeholder="Goles rival"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button className="bg-navy text-white text-sm rounded-lg py-2">Registrar partido</button>
        </form>
      </div>

      {partido && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium mb-2">
            Convocados · {partido.fecha} vs {partido.rival} ({convocadosDelPartido.length})
          </p>
          <div className="flex flex-col gap-1.5 mb-3">
            {convocadosDelPartido.length === 0 && (
              <p className="text-xs text-gray-400">Todavía no has agregado jugadores a este partido.</p>
            )}
            {convocadosDelPartido.map((pj) => (
              <div key={pj.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                <span>
                  {jugadoresPorId.get(pj.jugador_id) ?? 'Jugador'}
                  {pj.goles > 0 && ` · ${pj.goles} gol${pj.goles > 1 ? 'es' : ''}`}
                  {pj.asistencias > 0 && ` · ${pj.asistencias} asist.`}
                  {pj.actuacion != null && ` · ${pj.actuacion}/10`}
                </span>
                <button onClick={() => quitarConvocado(pj.id)} className="shrink-0 text-red-600 font-medium">
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={agregarConvocado} className="flex flex-col gap-2">
            <select name="jugador_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Jugador...</option>
              {jugadoresDeLaCategoria.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nombre}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input name="goles" type="number" min={0} defaultValue={0} placeholder="Goles" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input name="asistencias" type="number" min={0} defaultValue={0} placeholder="Asist." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input name="actuacion" type="number" min={1} max={10} placeholder="Nota 1-10" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button className="bg-navy text-white text-sm rounded-lg py-2">Agregar convocado</button>
          </form>
        </div>
      )}
    </div>
  )
}
