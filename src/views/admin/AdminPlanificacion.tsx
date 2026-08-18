import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  validarTarea,
  resolverTipoSesion,
  resolverDiagramaEfectivo,
  type BancoEjercicio,
  type ReglaEjercicio,
  type Sesion,
  type SesionTarea,
} from '../../lib/planificacion'
import { obtenerEjerciciosTacticaFc, esImagenValida } from '../../lib/tacticaFcClient'
import { sincronizarFila, eliminarFilaSheets } from '../../lib/sheetsSync'

type Categoria = { id: string; nombre: string }

type Props = {
  categorias: Categoria[]
  ejercicios: BancoEjercicio[]
  reglas: ReglaEjercicio[]
  sesiones: Sesion[]
  sesionTareas: SesionTarea[]
  onRecargar: () => void
  avisar: (texto: string) => void
}

const tiposSesion = ['Técnico', 'Táctico', 'Físico', 'Mixto', 'Técnico (neutro)']

export default function AdminPlanificacion({
  categorias,
  ejercicios,
  reglas,
  sesiones,
  sesionTareas,
  onRecargar,
  avisar,
}: Props) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [tacticaThumbPorId, setTacticaThumbPorId] = useState<Map<string, string | null>>(new Map())

  useEffect(() => {
    obtenerEjerciciosTacticaFc().then((lista) => {
      setTacticaThumbPorId(new Map(lista.map((t) => [t.id, t.thumb])))
    })
  }, [])

  const categoriasPorId = new Map(categorias.map((c) => [c.id, c.nombre]))
  const ejerciciosPorId = new Map(ejercicios.map((e) => [e.id, e]))
  const sesion = sesiones.find((s) => s.id === seleccionada) ?? null
  const tareasDeSesion = sesion
    ? sesionTareas.filter((t) => t.sesion_id === sesion.id).sort((a, b) => a.orden - b.orden)
    : []

  async function crearSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    setGuardando(true)
    const { data, error } = await supabase
      .from('sesiones')
      .insert({
        categoria_id: fd.get('categoria_id'),
        fecha: fd.get('fecha'),
        sesion_numero: Number(fd.get('sesion_numero')),
        microciclo: fd.get('microciclo') || null,
        mesociclo: fd.get('mesociclo') || null,
        entrenador: fd.get('entrenador') || null,
        hora: fd.get('hora') || null,
        lugar: fd.get('lugar') || null,
        tiempo_total_min: fd.get('tiempo_total_min') ? Number(fd.get('tiempo_total_min')) : null,
        tipo_sesion: fd.get('tipo_sesion') || null,
        objetivo_tecnico_tactico: fd.get('objetivo_tecnico_tactico') || null,
        objetivo_psicologico: fd.get('objetivo_psicologico') || null,
      })
      .select()
      .single()
    setGuardando(false)
    avisar(error ? 'Error: ' + error.message : 'Sesión creada, agrega hasta 3 tareas abajo')
    if (!error && data) {
      sincronizarFila('sesiones', data)
      form.reset()
      onRecargar()
      setSeleccionada(data.id)
    }
  }

  async function borrarSesion(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('sesiones').delete().eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Sesión eliminada')
    if (!error) {
      eliminarFilaSheets('sesiones', id)
      if (seleccionada === id) setSeleccionada(null)
      onRecargar()
    }
  }

  async function agregarTarea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase || !sesion) return
    if (tareasDeSesion.length >= 3) {
      avisar('Esta sesión ya tiene 3 tareas (el máximo)')
      return
    }
    const form = e.currentTarget
    const fd = new FormData(form)
    const { data, error } = await supabase
      .from('sesion_tareas')
      .insert({
        sesion_id: sesion.id,
        orden: tareasDeSesion.length + 1,
        ejercicio_id: fd.get('ejercicio_id'),
        tipo_sesion_override: fd.get('tipo_sesion_override') || null,
        diagrama_url_override: fd.get('diagrama_url_override') || null,
      })
      .select()
      .single()
    avisar(error ? 'Error: ' + error.message : 'Tarea agregada')
    if (!error) {
      if (data) sincronizarFila('sesion_tareas', data)
      form.reset()
      onRecargar()
    }
  }

  async function quitarTarea(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('sesion_tareas').delete().eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Tarea eliminada')
    if (!error) {
      eliminarFilaSheets('sesion_tareas', id)
      onRecargar()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Sesiones planificadas ({sesiones.length})</p>
        <div className="flex flex-col gap-1.5 mb-3 max-h-56 overflow-y-auto">
          {sesiones.length === 0 && <p className="text-xs text-gray-400">Todavía no hay sesiones planificadas.</p>}
          {sesiones.map((s) => (
            <div key={s.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
              <button onClick={() => setSeleccionada(s.id === seleccionada ? null : s.id)} className="text-left flex-1 min-w-0">
                <p className="font-medium truncate">
                  Sesión #{s.sesion_numero} · {s.fecha} · {categoriasPorId.get(s.categoria_id) ?? ''}
                </p>
                <p className="text-gray-500 truncate">
                  {s.tipo_sesion ?? 'Sin tipo'} {s.microciclo ? `· ${s.microciclo}` : ''} {s.mesociclo ? `· ${s.mesociclo}` : ''}
                </p>
              </button>
              <button onClick={() => borrarSesion(s.id)} className="shrink-0 text-red-600 font-medium">
                Quitar
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={crearSesion} className="flex flex-col gap-2">
          <p className="text-sm font-medium">Nueva sesión</p>
          <select name="categoria_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Categoría...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input name="fecha" required type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
            <input
              name="sesion_numero"
              required
              type="number"
              placeholder="N.° de sesión"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <input name="microciclo" placeholder="Microciclo" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
            <input name="mesociclo" placeholder="Mesociclo" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <div className="flex gap-2">
            <input name="entrenador" placeholder="Entrenador" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
            <input name="hora" placeholder="Hora" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <div className="flex gap-2">
            <input name="lugar" placeholder="Lugar" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
            <input
              name="tiempo_total_min"
              type="number"
              placeholder="Tiempo total (min)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <select name="tipo_sesion" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tipo de sesión...</option>
            {tiposSesion.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <textarea
            name="objetivo_tecnico_tactico"
            placeholder="Objetivo técnico-táctico"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[50px]"
          />
          <textarea
            name="objetivo_psicologico"
            placeholder="Objetivo psicológico"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[50px]"
          />
          <button disabled={guardando} className="bg-navy text-white text-sm rounded-lg py-2 disabled:opacity-60">
            {guardando ? 'Guardando…' : 'Crear sesión'}
          </button>
        </form>
      </div>

      {sesion && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Plantilla · Sesión #{sesion.sesion_numero} ({tareasDeSesion.length}/3 tareas)
            </p>
            <button onClick={() => window.print()} className="text-blue-600 font-medium text-xs">
              Imprimir
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs mb-3">
            <p className="font-medium">
              {categoriasPorId.get(sesion.categoria_id) ?? ''} · {sesion.fecha} · {sesion.hora ?? 'sin hora'} ·{' '}
              {sesion.lugar ?? 'sin lugar'}
            </p>
            <p className="text-gray-500">
              {sesion.tipo_sesion ?? 'Sin tipo'} · {sesion.tiempo_total_min ?? '—'} min · Entrenador:{' '}
              {sesion.entrenador ?? '—'}
            </p>
            {sesion.objetivo_tecnico_tactico && <p className="mt-1">Técnico-táctico: {sesion.objetivo_tecnico_tactico}</p>}
            {sesion.objetivo_psicologico && <p>Psicológico: {sesion.objetivo_psicologico}</p>}
          </div>

          <div className="flex flex-col gap-1.5 mb-3">
            {tareasDeSesion.map((t) => {
              const ej = ejerciciosPorId.get(t.ejercicio_id)
              if (!ej) return null
              const tipoEfectivo = resolverTipoSesion(t, sesion)
              const diagrama = resolverDiagramaEfectivo(t, ej, tacticaThumbPorId)
              const resultado = validarTarea(t, ej, sesion, reglas)
              return (
                <div key={t.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">
                      Tarea {t.orden} · {ej.nombre}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {resultado.sinRegla ? (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">Sin regla</span>
                      ) : resultado.ok ? (
                        <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700">✅ OK</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">⚠ Revisar</span>
                      )}
                      <button onClick={() => quitarTarea(t.id)} className="text-red-600 font-medium">
                        Quitar
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500">
                    {tipoEfectivo ?? 'Sin tipo'} · {ej.componente_fisico} · {ej.jugadores}j · {ej.espacio_m2}m² ·{' '}
                    {ej.tiempo_min}min · {ej.series} series
                  </p>
                  {!resultado.ok && !resultado.sinRegla && (
                    <ul className="text-amber-700 mt-1 list-disc list-inside">
                      {resultado.avisos.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                  {diagrama && esImagenValida(diagrama) && (
                    <img src={diagrama} alt={`Diagrama de ${ej.nombre}`} className="mt-1.5 rounded-lg border border-gray-200 max-h-40" />
                  )}
                  {diagrama && !esImagenValida(diagrama) && (
                    <a href={diagrama} target="_blank" rel="noreferrer" className="text-blue-600 font-medium">
                      Ver diagrama ↗
                    </a>
                  )}
                </div>
              )
            })}
            {tareasDeSesion.length === 0 && <p className="text-xs text-gray-400">Todavía no hay tareas en esta sesión.</p>}
          </div>

          {tareasDeSesion.length < 3 && (
            <form onSubmit={agregarTarea} className="flex flex-col gap-2">
              <p className="text-sm font-medium">Agregar tarea {tareasDeSesion.length + 1} de 3</p>
              <select name="ejercicio_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Ejercicio del banco...</option>
                {ejercicios.map((ej) => (
                  <option key={ej.id} value={ej.id}>
                    {ej.nombre} ({ej.tipo_tarea})
                  </option>
                ))}
              </select>
              <select name="tipo_sesion_override" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Usar tipo de la sesión ({sesion.tipo_sesion ?? 'sin tipo'})</option>
                {tiposSesion.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="text-[11px] text-gray-500 -mb-1">Diagrama distinto al del ejercicio (opcional)</label>
              <input
                name="diagrama_url_override"
                placeholder="https://..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button className="bg-navy text-white text-sm rounded-lg py-2">Agregar tarea</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
