import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { pagosMock, type Pago } from '../data/mockData'

const estilosEstado: Record<string, string> = {
  pagado: 'bg-green-100 text-green-700',
  vence: 'bg-amber-100 text-amber-700',
  atrasado: 'bg-red-100 text-red-700',
}

function formatoRD(monto: number) {
  return 'RD$' + monto.toLocaleString('es-DO')
}

type Props = {
  jugadorId?: string | null
}

export default function Pagos({ jugadorId }: Props) {
  const [pagos, setPagos] = useState<Pago[]>(pagosMock)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let query = supabase.from('pagos').select('*').order('fecha_limite', { ascending: true })
    if (jugadorId) query = query.eq('jugador_id', jugadorId)
    query.then(({ data, error }) => {
      if (!error && data) {
        setPagos(
          data.map((p: any) => ({
            id: p.id,
            mes: p.mes,
            monto: p.monto,
            estado: p.estado,
            fecha_limite: p.fecha_limite,
          }))
        )
      }
    })
  }, [jugadorId])

  async function enviarReporte(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget

    // Modo de muestra (sin Supabase configurado o sin jugador real): no
    // hay nada que guardar, solo mostramos cómo se sentiría.
    if (!supabase || !jugadorId) {
      setMensaje('Modo de muestra: esto todavía no se guarda. Conecta Supabase para que funcione de verdad.')
      setMostrarForm(false)
      setTimeout(() => setMensaje(null), 5000)
      return
    }

    setEnviando(true)
    const fd = new FormData(form)
    const { error } = await supabase.from('reportes_pago').insert({
      jugador_id: jugadorId,
      mes: fd.get('mes'),
      referencia: fd.get('referencia'),
      nota: fd.get('nota'),
    })
    setEnviando(false)
    if (!error) {
      setMensaje('Reporte enviado. El club lo va a confirmar pronto.')
      setMostrarForm(false)
      form.reset()
    } else {
      setMensaje('Error al enviar: ' + error.message)
    }
    setTimeout(() => setMensaje(null), 5000)
  }

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-2">Estado de mensualidad</p>
      <div className="flex flex-col gap-3">
        {pagos.map((p) => (
          <div key={p.id} className="bg-gray-50 rounded-xl px-3.5 py-3">
            <p className="text-xs text-gray-500">{p.mes}</p>
            <p className="text-xl font-medium mt-0.5">{formatoRD(p.monto)}</p>
            <span className={`inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-md ${estilosEstado[p.estado]}`}>
              {p.estado === 'pagado'
                ? 'Pagado · ' + new Date(p.fecha_limite).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
                : 'Vence ' + new Date(p.fecha_limite).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        ))}
      </div>

      {mensaje && <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-3">{mensaje}</p>}

      {!mostrarForm ? (
        <button
          onClick={() => setMostrarForm(true)}
          className="w-full mt-4 bg-navy text-white text-sm rounded-lg py-2.5"
        >
          Reportar pago
        </button>
      ) : (
        <form onSubmit={enviarReporte} className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium">Reportar pago</p>
          <input
            name="mes"
            required
            placeholder="Mes que pagaste (ej. Agosto 2026)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="referencia"
            placeholder="Número de referencia o transferencia"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            name="nota"
            placeholder="Nota (opcional)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[60px]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="flex-1 border border-gray-300 text-gray-600 text-sm rounded-lg py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-navy text-white text-sm rounded-lg py-2 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
