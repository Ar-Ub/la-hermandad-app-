import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { eventosMock, type Evento } from '../data/mockData'

const estilosEstado: Record<string, string> = {
  confirmado: 'bg-green-100 text-green-700',
  por_confirmar: 'bg-amber-100 text-amber-700',
  pendiente: 'bg-gray-100 text-gray-600',
}

const etiquetaEstado: Record<string, string> = {
  confirmado: 'Confirmado',
  por_confirmar: 'Confirmar',
  pendiente: 'Pendiente',
}

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

type Props = {
  // Categoría del jugador seleccionado. Se muestran los eventos de esa
  // categoría más los del club entero (categoria_id null).
  categoriaId?: string | null
}

export default function Calendario({ categoriaId }: Props) {
  const [eventos, setEventos] = useState<Evento[]>(eventosMock)

  useEffect(() => {
    if (!supabase) return
    let query = supabase.from('eventos').select('*').order('fecha', { ascending: true })
    if (categoriaId) {
      query = query.or(`categoria_id.eq.${categoriaId},categoria_id.is.null`)
    }
    query.then(({ data, error }) => {
      if (!error && data) {
        setEventos(
          data.map((ev: any) => ({
            id: ev.id,
            titulo: ev.titulo,
            fecha: ev.fecha,
            hora: ev.hora ?? '',
            lugar: ev.lugar ?? '',
            estado: ev.estado ?? 'pendiente',
          }))
        )
      }
    })
  }, [categoriaId])

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-2">Próximos eventos</p>
      {eventos.map((ev) => {
        const d = new Date(ev.fecha + 'T00:00:00')
        return (
          <div key={ev.id} className="flex gap-3 py-2.5 border-t border-gray-100 first:border-t-0">
            <div className="w-9 text-center shrink-0">
              <p className="text-[10px] text-gray-400">{meses[d.getMonth()]}</p>
              <p className="text-base font-medium">{d.getDate()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ev.titulo}</p>
              <p className="text-xs text-gray-500 truncate">
                {ev.hora} · {ev.lugar}
              </p>
            </div>
            <span className={`self-center text-[11px] px-2 py-0.5 rounded-md shrink-0 ${estilosEstado[ev.estado]}`}>
              {etiquetaEstado[ev.estado]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
