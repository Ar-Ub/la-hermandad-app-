import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { sincronizarFila } from '../../lib/sheetsSync'

export type SolicitudRegistro = {
  id: string
  nombre: string
  posicion: string | null
  categoria_id: string | null
  familia_email: string
  fecha_nacimiento: string | null
  foto_url: string | null
  responsable_nombre: string | null
  responsable_parentesco: string | null
  responsable_telefono: string | null
  contacto_emergencia_nombre: string | null
  contacto_emergencia_telefono: string | null
  tipo_sangre: string | null
  alergias: string | null
  condiciones_medicas: string | null
  seguro_medico: string | null
  estado: string
  created_at: string
  club_id: string
}

type Categoria = { id: string; nombre: string }

type Props = {
  solicitudes: SolicitudRegistro[]
  categorias: Categoria[]
  clubSlug?: string | null
  onRecargar: () => void
  avisar: (texto: string) => void
}

export default function AdminSolicitudes({ solicitudes, categorias, clubSlug, onRecargar, avisar }: Props) {
  const [copiado, setCopiado] = useState(false)
  const link = `${window.location.origin}/?registro=1${clubSlug ? `&club=${clubSlug}` : ''}`
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c.nombre]))

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente')
  const procesadas = solicitudes.filter((s) => s.estado !== 'pendiente')

  function copiarLink() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  async function aprobar(s: SolicitudRegistro) {
    if (!supabase) return
    const { data: jugador, error: errorJugador } = await supabase
      .from('jugadores')
      .insert({
        nombre: s.nombre,
        posicion: s.posicion,
        categoria_id: s.categoria_id,
        familia_email: s.familia_email,
        fecha_nacimiento: s.fecha_nacimiento,
        foto_url: s.foto_url,
        club_id: s.club_id,
        asistencia_pct: 0,
        partidos_jugados: 0,
        responsable_nombre: s.responsable_nombre,
        responsable_parentesco: s.responsable_parentesco,
        responsable_telefono: s.responsable_telefono,
        contacto_emergencia_nombre: s.contacto_emergencia_nombre,
        contacto_emergencia_telefono: s.contacto_emergencia_telefono,
        tipo_sangre: s.tipo_sangre,
        alergias: s.alergias,
        condiciones_medicas: s.condiciones_medicas,
        seguro_medico: s.seguro_medico,
      })
      .select()
      .single()

    if (errorJugador) {
      avisar('Error creando jugador: ' + errorJugador.message)
      return
    }

    const { error: errorSolicitud } = await supabase
      .from('solicitudes_registro')
      .update({ estado: 'aprobada' })
      .eq('id', s.id)

    avisar(errorSolicitud ? 'Jugador creado, pero no se pudo marcar la solicitud: ' + errorSolicitud.message : 'Solicitud aprobada, jugador agregado')

    if (jugador) sincronizarFila('jugadores', jugador)
    sincronizarFila('solicitudes_registro', { ...s, estado: 'aprobada' })
    onRecargar()
  }

  async function rechazar(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('solicitudes_registro').update({ estado: 'rechazada' }).eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Solicitud rechazada')
    if (!error) {
      const s = solicitudes.find((x) => x.id === id)
      if (s) sincronizarFila('solicitudes_registro', { ...s, estado: 'rechazada' })
      onRecargar()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Link de registro para padres</p>
        <p className="text-xs text-gray-500 mb-2">
          Comparte este enlace (WhatsApp, redes, etc.). No requiere cuenta — el padre llena los datos del jugador y
          quedan aquí como solicitud pendiente hasta que la apruebes.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            onClick={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600"
          />
          <button onClick={copiarLink} className="shrink-0 bg-navy text-white text-xs rounded-lg px-3 py-2">
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium mb-2">Pendientes de revisión ({pendientes.length})</p>
        {pendientes.length === 0 && <p className="text-xs text-gray-400">No hay solicitudes nuevas.</p>}
        <div className="flex flex-col gap-2">
          {pendientes.map((s) => (
            <div key={s.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
              <p className="font-medium">
                {s.nombre} · {s.categoria_id ? categoriaPorId.get(s.categoria_id) ?? 'Categoría desconocida' : 'Sin categoría'}
              </p>
              <p className="text-gray-500">
                {s.posicion || 'Sin posición'} · Familia: {s.familia_email}
              </p>
              {s.responsable_nombre && (
                <p className="text-gray-500">
                  Responsable: {s.responsable_nombre}
                  {s.responsable_parentesco ? ` (${s.responsable_parentesco})` : ''}
                  {s.responsable_telefono ? ` · ${s.responsable_telefono}` : ''}
                </p>
              )}
              {(s.alergias || s.condiciones_medicas) && (
                <p className="text-red-600">
                  {s.alergias && `Alergias: ${s.alergias}`}
                  {s.alergias && s.condiciones_medicas && ' · '}
                  {s.condiciones_medicas && `Condiciones: ${s.condiciones_medicas}`}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <button onClick={() => aprobar(s)} className="text-green-700 font-medium">
                  Aprobar
                </button>
                <button onClick={() => rechazar(s.id)} className="text-red-600 font-medium">
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {procesadas.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium mb-2">Ya procesadas ({procesadas.length})</p>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {procesadas.map((s) => (
              <div key={s.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                <span className="truncate">{s.nombre}</span>
                <span className={s.estado === 'aprobada' ? 'text-green-700' : 'text-red-600'}>
                  {s.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
