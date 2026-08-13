import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { avisosMock, type Aviso } from '../data/mockData'

function tiempoRelativo(fechaIso: string) {
  const diffMs = Date.now() - new Date(fechaIso).getTime()
  const horas = Math.floor(diffMs / 36e5)
  if (horas < 1) return 'Hace un momento'
  if (horas < 24) return `Hace ${horas} hora${horas === 1 ? '' : 's'}`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`
}

type Props = {
  // Categoría del jugador seleccionado. Se muestran los avisos de esa
  // categoría más los del club entero (categoria_id null).
  categoriaId?: string | null
}

export default function Avisos({ categoriaId }: Props) {
  const [avisos, setAvisos] = useState<Aviso[]>(avisosMock)

  useEffect(() => {
    if (!supabase) return
    let query = supabase.from('avisos').select('*').order('created_at', { ascending: false })
    if (categoriaId) {
      query = query.or(`categoria_id.eq.${categoriaId},categoria_id.is.null`)
    }
    query.then(({ data, error }) => {
      if (!error && data) {
        setAvisos(
          data.map((a: any) => ({
            id: a.id,
            titulo: a.titulo,
            cuerpo: a.cuerpo,
            fecha: tiempoRelativo(a.created_at),
          }))
        )
      }
    })
  }, [categoriaId])

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-2">Avisos del club</p>
      {avisos.map((a) => (
        <div key={a.id} className="py-2.5 border-t border-gray-100 first:border-t-0">
          <p className="text-sm font-medium">{a.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{a.cuerpo}</p>
          <p className="text-[10px] text-gray-400 mt-1">{a.fecha}</p>
        </div>
      ))}
    </div>
  )
}
