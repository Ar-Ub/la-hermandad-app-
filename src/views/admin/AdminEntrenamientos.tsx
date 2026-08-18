import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Entrenamiento, EntrenamientoAsistencia } from '../../lib/estadisticas'
import { sincronizarFila, eliminarFilaSheets } from '../../lib/sheetsSync'

type Categoria = { id: string; nombre: string }
type JugadorBasico = { id: string; nombre: string; categoria_id: string | null }

type Props = {
  categorias: Categoria[]
  jugadores: JugadorBasico[]
  entrenamientos: Entrenamiento[]
  asistencias: EntrenamientoAsistencia[]
  onRecargar: () => void
  avisar: (texto: string) => void
}

export default function AdminEntrenamientos({
  categorias,
  jugadores,
  entrenamientos,
  asistencias,
  onRecargar,
  avisar,
}: Props) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  const [guardando, setGuardando] = useState(false)

  const entrenamiento = entrenamientos.find((e) => e.id === seleccionado) ?? null
  const jugadoresDeLaCategoria = entrenamiento ? jugadores.filter((j) => j.categoria_id === entrenamiento.categoria_id) : []
  const categoriasPorId = new Map(categorias.map((c) => [c.id, c.nombre]))

  useEffect(() => {
    if (!entrenamiento) {
      setMarcados({})
      return
    }
    const previas = asistencias.filter((a) => a.entrenamiento_id === entrenamiento.id)
    const inicial: Record<string, boolean> = {}
    for (const j of jugadoresDeLaCategoria) {
      const previa = previas.find((a) => a.jugador_id === j.id)
      inicial[j.id] = previa ? previa.asistio : true
    }
    setMarcados(inicial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionado])

  async function crearSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const { data, error } = await supabase
      .from('entrenamientos')
      .insert({ categoria_id: fd.get('categoria_id'), fecha: fd.get('fecha') })
      .select()
      .single()
    avisar(error ? 'Error: ' + error.message : 'Sesión creada, marca la asistencia abajo')
    if (!error && data) {
      sincronizarFila('entrenamientos', data)
      form.reset()
      onRecargar()
      setSeleccionado(data.id)
    }
  }

  async function borrarSesion(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('entrenamientos').delete().eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Sesión eliminada')
    if (!error) {
      eliminarFilaSheets('entrenamientos', id)
      if (seleccionado === id) setSeleccionado(null)
      onRecargar()
    }
  }

  async function guardarAsistencia() {
    if (!supabase || !entrenamiento) return
    setGuardando(true)
    await supabase.from('entrenamiento_asistencias').delete().eq('entrenamiento_id', entrenamiento.id)
    const filas = jugadoresDeLaCategoria.map((j) => ({
      entrenamiento_id: entrenamiento.id,
      jugador_id: j.id,
      asistio: Boolean(marcados[j.id]),
    }))
    const { data, error } = filas.length
      ? await supabase.from('entrenamiento_asistencias').insert(filas).select()
      : { data: [], error: null }
    setGuardando(false)
    avisar(error ? 'Error: ' + error.message : 'Asistencia guardada')
    if (!error) {
      // La asistencia de esta sesión se borra y se vuelve a insertar cada
      // vez que se guarda (con ids nuevos en Supabase). Para que la fila en
      // Sheets no se duplique en cada resave, se manda con un id fijo por
      // combinación entrenamiento+jugador en vez del id real de la fila.
      ;(data ?? []).forEach((fila: any) => {
        sincronizarFila('entrenamiento_asistencias', {
          ...fila,
          id: fila.entrenamiento_id + '_' + fila.jugador_id,
        })
      })
      onRecargar()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Sesiones registradas ({entrenamientos.length})</p>
        <div className="flex flex-col gap-1.5 mb-3 max-h-56 overflow-y-auto">
          {entrenamientos.length === 0 && <p className="text-xs text-gray-400">Todavía no hay sesiones registradas.</p>}
          {entrenamientos.map((e) => (
            <div key={e.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
              <button
                onClick={() => setSeleccionado(e.id === seleccionado ? null : e.id)}
                className="text-left flex-1 min-w-0"
              >
                <p className="font-medium truncate">
                  {e.fecha} · {categoriasPorId.get(e.categoria_id) ?? ''}
                </p>
              </button>
              <button onClick={() => borrarSesion(e.id)} className="shrink-0 text-red-600 font-medium">
                Quitar
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={crearSesion} className="flex flex-col gap-2">
          <select name="categoria_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Categoría...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input name="fecha" type="date" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-navy text-white text-sm rounded-lg py-2">Crear sesión</button>
        </form>
      </div>

      {entrenamiento && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium mb-2">
            Asistencia · {entrenamiento.fecha} ({jugadoresDeLaCategoria.length} jugadores)
          </p>
          {jugadoresDeLaCategoria.length === 0 ? (
            <p className="text-xs text-gray-400 mb-3">No hay jugadores en esta categoría todavía.</p>
          ) : (
            <div className="flex flex-col gap-1 mb-3 max-h-56 overflow-y-auto">
              {jugadoresDeLaCategoria.map((j) => (
                <label key={j.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                  <span>{j.nombre}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(marcados[j.id])}
                    onChange={(ev) => setMarcados((prev) => ({ ...prev, [j.id]: ev.target.checked }))}
                    className="w-4 h-4"
                  />
                </label>
              ))}
            </div>
          )}
          <button
            onClick={guardarAsistencia}
            disabled={guardando || jugadoresDeLaCategoria.length === 0}
            className="w-full bg-navy text-white text-sm rounded-lg py-2 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar asistencia'}
          </button>
        </div>
      )}
    </div>
  )
}
