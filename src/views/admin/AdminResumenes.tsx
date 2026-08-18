import { useMemo, useState } from 'react'
import type { BancoEjercicio, Sesion, SesionTarea } from '../../lib/planificacion'
import { resolverTipoSesion } from '../../lib/planificacion'

type Categoria = { id: string; nombre: string }

type Props = {
  categorias: Categoria[]
  ejercicios: BancoEjercicio[]
  sesiones: Sesion[]
  sesionTareas: SesionTarea[]
}

function contarFrecuencias(valores: (string | null)[]): [string, number][] {
  const conteo = new Map<string, number>()
  for (const v of valores) {
    const key = v || 'Sin dato'
    conteo.set(key, (conteo.get(key) ?? 0) + 1)
  }
  return [...conteo.entries()].sort((a, b) => b[1] - a[1])
}

export default function AdminResumenes({ categorias, ejercicios, sesiones, sesionTareas }: Props) {
  const categoriasPorId = new Map(categorias.map((c) => [c.id, c.nombre]))
  const ejerciciosPorId = new Map(ejercicios.map((e) => [e.id, e]))

  const meses = useMemo(() => {
    const set = new Set(sesiones.map((s) => s.fecha.slice(0, 7)))
    return [...set].sort().reverse()
  }, [sesiones])

  const [mes, setMes] = useState(meses[0] ?? '')
  const [meta, setMeta] = useState('')

  const [tipoCiclo, setTipoCiclo] = useState<'microciclo' | 'mesociclo'>('microciclo')
  const valoresCiclo = useMemo(() => {
    const set = new Set(
      sesiones.map((s) => (tipoCiclo === 'microciclo' ? s.microciclo : s.mesociclo)).filter(Boolean) as string[]
    )
    return [...set].sort()
  }, [sesiones, tipoCiclo])
  const [cicloSeleccionado, setCicloSeleccionado] = useState('')

  const sesionesDelMes = mes ? sesiones.filter((s) => s.fecha.slice(0, 7) === mes) : []
  const tareasDelMes = sesionTareas.filter((t) => sesionesDelMes.some((s) => s.id === t.sesion_id))
  const tiposDelMes = tareasDelMes
    .map((t) => {
      const sesion = sesionesDelMes.find((s) => s.id === t.sesion_id)
      return sesion ? resolverTipoSesion(t, sesion) : null
    })
    .filter(Boolean)
  const componentesDelMes = tareasDelMes.map((t) => ejerciciosPorId.get(t.ejercicio_id)?.componente_fisico ?? null)

  const sesionesDelCiclo = cicloSeleccionado
    ? sesiones.filter((s) => (tipoCiclo === 'microciclo' ? s.microciclo : s.mesociclo) === cicloSeleccionado)
    : []
  const tareasDelCiclo = sesionTareas.filter((t) => sesionesDelCiclo.some((s) => s.id === t.sesion_id))
  const tiposDelCiclo = tareasDelCiclo
    .map((t) => {
      const sesion = sesionesDelCiclo.find((s) => s.id === t.sesion_id)
      return sesion ? resolverTipoSesion(t, sesion) : null
    })
    .filter(Boolean)

  const metaNum = meta ? Number(meta) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Resumen mensual</p>
        {meses.length === 0 ? (
          <p className="text-xs text-gray-400">Todavía no hay sesiones planificadas para resumir.</p>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <select value={mes} onChange={(e) => setMes(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full">
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                type="number"
                placeholder="Meta de sesiones"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
              />
            </div>
            <div
              className={`text-xs rounded-lg px-3 py-2 mb-2 ${
                metaNum != null && sesionesDelMes.length < metaNum ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
              }`}
            >
              {sesionesDelMes.length} sesión(es) planificadas
              {metaNum != null && ` de una meta de ${metaNum} — ${sesionesDelMes.length >= metaNum ? 'cumplida ✅' : `faltan ${metaNum - sesionesDelMes.length}`}`}
            </div>

            <p className="text-xs font-medium mb-1">Categorías con sesiones este mes</p>
            <p className="text-xs text-gray-500 mb-3">
              {[...new Set(sesionesDelMes.map((s) => categoriasPorId.get(s.categoria_id) ?? '—'))].join(', ') || '—'}
            </p>

            <p className="text-xs font-medium mb-1">Frecuencia por tipo de sesión</p>
            <div className="flex flex-col gap-1 mb-3">
              {contarFrecuencias(tiposDelMes as string[]).map(([tipo, n]) => (
                <div key={tipo} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                  <span>{tipo}</span>
                  <span className="font-medium">{n}</span>
                </div>
              ))}
              {tiposDelMes.length === 0 && <p className="text-xs text-gray-400">Sin tareas registradas este mes.</p>}
            </div>

            <p className="text-xs font-medium mb-1">Frecuencia por componente físico</p>
            <div className="flex flex-col gap-1">
              {contarFrecuencias(componentesDelMes).map(([comp, n]) => (
                <div key={comp} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                  <span>{comp}</span>
                  <span className="font-medium">{n}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium mb-2">Resumen por ciclo</p>
        <div className="flex gap-2 mb-2">
          <select
            value={tipoCiclo}
            onChange={(e) => {
              setTipoCiclo(e.target.value as 'microciclo' | 'mesociclo')
              setCicloSeleccionado('')
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
          >
            <option value="microciclo">Microciclo</option>
            <option value="mesociclo">Mesociclo</option>
          </select>
          <select
            value={cicloSeleccionado}
            onChange={(e) => setCicloSeleccionado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          >
            <option value="">Selecciona un {tipoCiclo}...</option>
            {valoresCiclo.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {cicloSeleccionado ? (
          <>
            <p className="text-xs text-gray-500 mb-2">{sesionesDelCiclo.length} sesión(es) en este {tipoCiclo}.</p>
            <p className="text-xs font-medium mb-1">Frecuencia por tipo de sesión</p>
            <div className="flex flex-col gap-1">
              {contarFrecuencias(tiposDelCiclo as string[]).map(([tipo, n]) => (
                <div key={tipo} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                  <span>{tipo}</span>
                  <span className="font-medium">{n}</span>
                </div>
              ))}
              {tiposDelCiclo.length === 0 && <p className="text-xs text-gray-400">Sin tareas registradas en este ciclo.</p>}
            </div>
          </>
        ) : (
          valoresCiclo.length === 0 && <p className="text-xs text-gray-400">Ninguna sesión tiene {tipoCiclo} asignado todavía.</p>
        )}
      </div>
    </div>
  )
}
