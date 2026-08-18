import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { ReglaEjercicio } from '../../lib/planificacion'
import { sincronizarFila, eliminarFilaSheets } from '../../lib/sheetsSync'

type Props = {
  reglas: ReglaEjercicio[]
  onRecargar: () => void
  avisar: (texto: string) => void
}

const camposNumericos = [
  ['jugadores_min', 'jugadores_max', 'Jugadores'],
  ['espacio_min', 'espacio_max', 'Espacio (m²)'],
  ['tiempo_min', 'tiempo_max', 'Tiempo (min)'],
  ['series_min', 'series_max', 'Series'],
  ['pausa_min', 'pausa_max', 'Pausa (seg)'],
  ['densidad_min', 'densidad_max', 'Densidad'],
] as const

export default function AdminReglas({ reglas, onRecargar, avisar }: Props) {
  const [guardando, setGuardando] = useState(false)

  async function crearRegla(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const num = (nombre: string) => {
      const v = fd.get(nombre)
      return v === '' || v == null ? null : Number(v)
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('reglas_ejercicios')
      .insert({
        tipo_tarea: fd.get('tipo_tarea'),
        componente_fisico: fd.get('componente_fisico'),
        jugadores_min: num('jugadores_min'),
        jugadores_max: num('jugadores_max'),
        espacio_min: num('espacio_min'),
        espacio_max: num('espacio_max'),
        tiempo_min: num('tiempo_min'),
        tiempo_max: num('tiempo_max'),
        series_min: num('series_min'),
        series_max: num('series_max'),
        pausa_min: num('pausa_min'),
        pausa_max: num('pausa_max'),
        densidad_min: num('densidad_min'),
        densidad_max: num('densidad_max'),
      })
      .select()
      .single()
    setGuardando(false)
    avisar(error ? 'Error: ' + error.message : 'Regla creada')
    if (!error) {
      if (data) sincronizarFila('reglas_ejercicios', data)
      form.reset()
      onRecargar()
    }
  }

  async function borrarRegla(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('reglas_ejercicios').delete().eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Regla eliminada')
    if (!error) {
      eliminarFilaSheets('reglas_ejercicios', id)
      onRecargar()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Reglas registradas ({reglas.length})</p>
        {reglas.length === 0 && (
          <p className="text-xs text-gray-400 mb-2">
            Todavía no hay reglas. Sin una regla para un tipo de tarea + componente físico, los ejercicios de esa
            combinación se guardan sin validar (no se marcan como fuera de rango).
          </p>
        )}
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {reglas.map((r) => (
            <div key={r.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {r.tipo_tarea} · {r.componente_fisico}
                </p>
                <button onClick={() => borrarRegla(r.id)} className="shrink-0 text-red-600 font-medium">
                  Quitar
                </button>
              </div>
              <p className="text-gray-500">
                Jugadores {r.jugadores_min ?? '—'}–{r.jugadores_max ?? '—'} · Espacio {r.espacio_min ?? '—'}–
                {r.espacio_max ?? '—'} m² · Tiempo {r.tiempo_min ?? '—'}–{r.tiempo_max ?? '—'} min
              </p>
              <p className="text-gray-500">
                Series {r.series_min ?? '—'}–{r.series_max ?? '—'} · Pausa {r.pausa_min ?? '—'}–{r.pausa_max ?? '—'} seg ·
                Densidad {r.densidad_min ?? '—'}–{r.densidad_max ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={crearRegla} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium">Nueva regla</p>
        <input
          name="tipo_tarea"
          required
          placeholder="Tipo de tarea (ej. Rondos)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="componente_fisico"
          required
          placeholder="Componente físico (ej. Tensión)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {camposNumericos.map(([minName, maxName, label]) => (
          <div key={minName} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 w-24 shrink-0">{label}</span>
            <input
              name={minName}
              type="number"
              step="any"
              placeholder="Mín"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
            <input
              name={maxName}
              type="number"
              step="any"
              placeholder="Máx"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
        ))}
        <button disabled={guardando} className="bg-navy text-white text-sm rounded-lg py-2 disabled:opacity-60">
          {guardando ? 'Guardando…' : 'Crear regla'}
        </button>
      </form>
    </div>
  )
}
