import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { validarEjercicio, type BancoEjercicio, type ReglaEjercicio } from '../../lib/planificacion'
import { obtenerEjerciciosTacticaFc, esImagenValida, type TacticaEjercicio } from '../../lib/tacticaFcClient'
import { sincronizarFila, eliminarFilaSheets } from '../../lib/sheetsSync'

type Props = {
  ejercicios: BancoEjercicio[]
  reglas: ReglaEjercicio[]
  onRecargar: () => void
  avisar: (texto: string) => void
}

type Borrador = {
  tipo_tarea: string
  componente_fisico: string
  jugadores: string
  espacio_m2: string
  tiempo_min: string
  series: string
  pausa_seg: string
}

const borradorVacio: Borrador = {
  tipo_tarea: '',
  componente_fisico: '',
  jugadores: '',
  espacio_m2: '',
  tiempo_min: '',
  series: '',
  pausa_seg: '',
}

export default function AdminBancoEjercicios({ ejercicios, reglas, onRecargar, avisar }: Props) {
  const [guardando, setGuardando] = useState(false)
  const [borrador, setBorrador] = useState<Borrador>(borradorVacio)
  const [filtro, setFiltro] = useState('')

  const [tacticaEjercicios, setTacticaEjercicios] = useState<TacticaEjercicio[]>([])
  const [tacticaCargando, setTacticaCargando] = useState(true)
  const [tacticaSeleccionado, setTacticaSeleccionado] = useState('')

  useEffect(() => {
    obtenerEjerciciosTacticaFc()
      .then(setTacticaEjercicios)
      .finally(() => setTacticaCargando(false))
  }, [])

  const tacticaPorId = useMemo(() => new Map(tacticaEjercicios.map((t) => [t.id, t])), [tacticaEjercicios])

  const previaValidacion = useMemo(() => {
    if (!borrador.tipo_tarea || !borrador.componente_fisico || !borrador.jugadores || !borrador.espacio_m2) return null
    return validarEjercicio(
      {
        tipo_tarea: borrador.tipo_tarea,
        componente_fisico: borrador.componente_fisico,
        jugadores: Number(borrador.jugadores),
        espacio_m2: Number(borrador.espacio_m2),
        tiempo_min: Number(borrador.tiempo_min) || 0,
        series: Number(borrador.series) || 0,
        pausa_seg: borrador.pausa_seg ? Number(borrador.pausa_seg) : null,
      },
      reglas
    )
  }, [borrador, reglas])

  const ejerciciosFiltrados = ejercicios.filter(
    (ej) =>
      ej.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      ej.tipo_tarea.toLowerCase().includes(filtro.toLowerCase())
  )

  async function crearEjercicio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    setGuardando(true)
    const { data, error } = await supabase
      .from('banco_ejercicios')
      .insert({
        nombre: fd.get('nombre'),
        tipo_tarea: fd.get('tipo_tarea'),
        enfoque: fd.get('enfoque') || null,
        componente_fisico: fd.get('componente_fisico'),
        jugadores: Number(fd.get('jugadores')),
        espacio_m2: Number(fd.get('espacio_m2')),
        tiempo_min: Number(fd.get('tiempo_min')),
        series: Number(fd.get('series')),
        pausa_seg: fd.get('pausa_seg') ? Number(fd.get('pausa_seg')) : null,
        diagrama_url: fd.get('diagrama_url') || null,
        notas: fd.get('notas') || null,
        tactica_exercise_id: tacticaSeleccionado || null,
      })
      .select()
      .single()
    setGuardando(false)
    avisar(error ? 'Error: ' + error.message : 'Ejercicio agregado al banco')
    if (!error) {
      if (data) sincronizarFila('banco_ejercicios', data)
      form.reset()
      setBorrador(borradorVacio)
      setTacticaSeleccionado('')
      onRecargar()
    }
  }

  async function borrarEjercicio(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('banco_ejercicios').delete().eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Ejercicio eliminado')
    if (!error) {
      eliminarFilaSheets('banco_ejercicios', id)
      onRecargar()
    }
  }

  async function desvincularTacticaFc(ej: BancoEjercicio) {
    if (!supabase) return
    const { data, error } = await supabase
      .from('banco_ejercicios')
      .update({ tactica_exercise_id: null })
      .eq('id', ej.id)
      .select()
      .single()
    avisar(error ? 'Error: ' + error.message : 'Ejercicio desvinculado de TacticaFC')
    if (!error) {
      if (data) sincronizarFila('banco_ejercicios', data)
      onRecargar()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
        Conectado con TacticaFC ({tacticaCargando ? 'cargando…' : `${tacticaEjercicios.length} ejercicio(s) disponibles`}).
        Los diagramas se muestran en vivo: si corriges uno en TacticaFC, se actualiza aquí solo.
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Banco de ejercicios ({ejercicios.length})</p>
        </div>
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nombre o tipo..."
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs mb-2"
        />
        {ejerciciosFiltrados.length === 0 && <p className="text-xs text-gray-400">Sin resultados.</p>}
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {ejerciciosFiltrados.map((ej) => {
            const resultado = validarEjercicio(ej, reglas)
            const tacticaEj = ej.tactica_exercise_id ? tacticaPorId.get(ej.tactica_exercise_id) : null
            const vinculadoRoto = Boolean(ej.tactica_exercise_id) && !tacticaCargando && !tacticaEj
            const diagramaAMostrar = tacticaEj ? tacticaEj.thumb : ej.diagrama_url
            return (
              <div key={ej.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{ej.nombre}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {resultado.sinRegla ? (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">Sin regla</span>
                    ) : resultado.ok ? (
                      <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700">✅ OK</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">⚠ Revisar</span>
                    )}
                    <button onClick={() => borrarEjercicio(ej.id)} className="text-red-600 font-medium">
                      Quitar
                    </button>
                  </div>
                </div>
                <p className="text-gray-500">
                  {ej.tipo_tarea} · {ej.componente_fisico} · {ej.jugadores}j · {ej.espacio_m2}m² · {ej.tiempo_min}min
                </p>
                {!resultado.ok && !resultado.sinRegla && (
                  <ul className="text-amber-700 mt-1 list-disc list-inside">
                    {resultado.avisos.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}

                {tacticaEj && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 shrink-0">🔗 TacticaFC (en vivo)</span>
                    <button onClick={() => desvincularTacticaFc(ej)} className="text-red-600 font-medium shrink-0">
                      Desvincular
                    </button>
                  </div>
                )}
                {vinculadoRoto && (
                  <p className="mt-1.5 text-amber-700">⚠ El ejercicio vinculado ya no existe en TacticaFC.</p>
                )}

                {diagramaAMostrar && esImagenValida(diagramaAMostrar) && (
                  <img src={diagramaAMostrar} alt={`Diagrama de ${ej.nombre}`} className="mt-2 rounded-lg border border-gray-200 max-h-32" />
                )}
                {diagramaAMostrar && !esImagenValida(diagramaAMostrar) && (
                  <a href={diagramaAMostrar} target="_blank" rel="noreferrer" className="text-blue-600 font-medium">
                    Ver diagrama ↗
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={crearEjercicio} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium">Nuevo ejercicio</p>
        <input name="nombre" required placeholder="Nombre del ejercicio" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input
          name="tipo_tarea"
          required
          placeholder="Tipo de tarea (ej. Rondos)"
          value={borrador.tipo_tarea}
          onChange={(e) => setBorrador((b) => ({ ...b, tipo_tarea: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input name="enfoque" placeholder="Enfoque (opcional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input
          name="componente_fisico"
          required
          placeholder="Componente físico (ej. Tensión)"
          value={borrador.componente_fisico}
          onChange={(e) => setBorrador((b) => ({ ...b, componente_fisico: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            name="jugadores"
            required
            type="number"
            placeholder="Jugadores"
            value={borrador.jugadores}
            onChange={(e) => setBorrador((b) => ({ ...b, jugadores: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
          <input
            name="espacio_m2"
            required
            type="number"
            step="any"
            placeholder="Espacio (m²)"
            value={borrador.espacio_m2}
            onChange={(e) => setBorrador((b) => ({ ...b, espacio_m2: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>
        <div className="flex gap-2">
          <input
            name="tiempo_min"
            required
            type="number"
            placeholder="Tiempo (min)"
            value={borrador.tiempo_min}
            onChange={(e) => setBorrador((b) => ({ ...b, tiempo_min: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
          <input
            name="series"
            required
            type="number"
            placeholder="Series"
            value={borrador.series}
            onChange={(e) => setBorrador((b) => ({ ...b, series: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
          <input
            name="pausa_seg"
            type="number"
            placeholder="Pausa (seg)"
            value={borrador.pausa_seg}
            onChange={(e) => setBorrador((b) => ({ ...b, pausa_seg: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          />
        </div>

        {previaValidacion && (
          <div
            className={`text-xs rounded-lg px-3 py-2 ${
              previaValidacion.sinRegla
                ? 'bg-gray-50 text-gray-500'
                : previaValidacion.ok
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {previaValidacion.sinRegla
              ? 'No hay una regla para este tipo de tarea + componente físico todavía.'
              : previaValidacion.ok
              ? '✅ Dentro de los rangos definidos en Reglas.'
              : '⚠ ' + previaValidacion.avisos.join(' · ')}
          </div>
        )}

        <label className="text-[11px] text-gray-500 -mb-1">Diagrama de TacticaFC (opcional, se actualiza solo)</label>
        <select
          value={tacticaSeleccionado}
          onChange={(e) => setTacticaSeleccionado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">
            {tacticaCargando ? 'Cargando ejercicios de TacticaFC…' : 'Sin vincular (usar diagrama manual abajo)'}
          </option>
          {tacticaEjercicios.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {!tacticaCargando && tacticaEjercicios.length === 0 && (
          <p className="text-[11px] text-gray-400 -mt-1">
            Todavía no hay ejercicios guardados en TacticaFC. En cuanto guardes uno allá, aparece aquí para elegir.
          </p>
        )}
        {tacticaSeleccionado && esImagenValida(tacticaPorId.get(tacticaSeleccionado)?.thumb) && (
          <img
            src={tacticaPorId.get(tacticaSeleccionado)!.thumb!}
            alt="Vista previa del diagrama"
            className="rounded-lg border border-gray-200 max-h-32"
          />
        )}

        <label className="text-[11px] text-gray-500 -mb-1">Diagrama manual (enlace directo — solo si no usas TacticaFC)</label>
        <input name="diagrama_url" placeholder="https://..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <textarea name="notas" placeholder="Notas (opcional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[60px]" />
        <button disabled={guardando} className="bg-navy text-white text-sm rounded-lg py-2 disabled:opacity-60">
          {guardando ? 'Guardando…' : 'Agregar al banco'}
        </button>
      </form>
    </div>
  )
}
