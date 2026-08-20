import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'
import { sincronizarFila } from '../lib/sheetsSync'
import { CLUB_SLUG_DEPLOYMENT } from '../lib/clubConfig'

// Formulario público de registro: el link se comparte con los padres
// (ver Admin > Solicitudes) y NO requiere cuenta ni login. Lo que llenan
// no crea el jugador directo — queda como solicitud pendiente para que el
// club la revise y apruebe desde el panel de Admin. Así evitamos que
// cualquiera con el link agregue jugadores fantasma al roster real, y de
// paso el club puede corregir la categoría si el padre se equivocó.

type Categoria = { id: string; nombre: string }
type Club = { id: string; nombre: string; logo_url: string | null }

// Slug por defecto si el link no trae "?club=...". Si este despliegue es
// el propio de un club (VITE_CLUB_SLUG configurado en Cloudflare), usa ese;
// si no, cae en "la-hermandad" para no romper links ya compartidos antes
// de que existiera el parámetro ?club=.
const SLUG_POR_DEFECTO = CLUB_SLUG_DEPLOYMENT || 'la-hermandad'

export default function RegistroPublico() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [club, setClub] = useState<Club | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = new URLSearchParams(window.location.search).get('club') || SLUG_POR_DEFECTO

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('clubes')
      .select('id, nombre, logo_url')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setClub(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!supabase || !club) return
    supabase
      .from('categorias')
      .select('id, nombre')
      .eq('club_id', club.id)
      .then(({ data }) => {
        if (data) setCategorias(data)
      })
  }, [club])

  async function enviarSolicitud(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!supabase) {
      setError('La app no está conectada a una base de datos todavía.')
      return
    }
    if (!club) {
      setError('No se pudo identificar el club de este link. Pide al club que te confirme el enlace correcto.')
      return
    }
    const form = e.currentTarget
    const fd = new FormData(form)
    const id = crypto.randomUUID()
    const payload = {
      id,
      club_id: club.id,
      nombre: fd.get('nombre') as string,
      posicion: (fd.get('posicion') as string) || null,
      categoria_id: (fd.get('categoria_id') as string) || null,
      familia_email: fd.get('familia_email') as string,
      fecha_nacimiento: (fd.get('fecha_nacimiento') as string) || null,
      foto_url: (fd.get('foto_url') as string) || null,
      responsable_nombre: (fd.get('responsable_nombre') as string) || null,
      responsable_parentesco: (fd.get('responsable_parentesco') as string) || null,
      responsable_telefono: (fd.get('responsable_telefono') as string) || null,
      contacto_emergencia_nombre: (fd.get('contacto_emergencia_nombre') as string) || null,
      contacto_emergencia_telefono: (fd.get('contacto_emergencia_telefono') as string) || null,
      tipo_sangre: (fd.get('tipo_sangre') as string) || null,
      alergias: (fd.get('alergias') as string) || null,
      condiciones_medicas: (fd.get('condiciones_medicas') as string) || null,
      seguro_medico: (fd.get('seguro_medico') as string) || null,
      estado: 'pendiente',
    }
    setEnviando(true)
    const { error } = await supabase.from('solicitudes_registro').insert(payload)
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    sincronizarFila('solicitudes_registro', payload)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] px-6 text-center gap-3">
        <img src={club?.logo_url || '/logo.png'} alt={club?.nombre ?? ''} className="w-16 h-16 rounded-full bg-white object-cover" />
        <p className="text-base font-medium">¡Solicitud recibida!</p>
        <p className="text-sm text-gray-500">
          {club?.nombre ?? 'El club'} va a revisar los datos y te contactaremos al correo que dejaste para confirmar
          la inscripción.
        </p>
      </div>
    )
  }

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <img src={club?.logo_url || '/logo.png'} alt={club?.nombre ?? ''} className="w-14 h-14 rounded-full bg-white object-cover" />
        <p className="text-base font-medium">Registro de jugador</p>
        <p className="text-xs text-gray-500">
          {club ? `Llena los datos de tu hijo/a para ${club.nombre}.` : 'Llena los datos de tu hijo/a.'} El club
          revisa cada solicitud antes de activarla.
        </p>
      </div>

      {!supabaseConfigured && (
        <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 mb-3">
          Supabase no está configurado todavía (ver README), así que este formulario no puede guardar nada por ahora.
        </div>
      )}

      <form onSubmit={enviarSolicitud} className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-500">Jugador</p>
        <input
          name="nombre"
          required
          placeholder="Nombre completo del jugador"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input name="posicion" placeholder="Posición (opcional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <select name="categoria_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Categoría...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <label className="text-[11px] text-gray-500 -mb-1">Fecha de nacimiento</label>
        <input name="fecha_nacimiento" type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <label className="text-[11px] text-gray-500 -mb-1">
          Foto (enlace directo, ej. desde Google Drive — opcional)
        </label>
        <input name="foto_url" placeholder="https://..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />

        <p className="text-xs font-medium text-gray-500 mt-2">Contacto de la familia</p>
        <label className="text-[11px] text-gray-500 -mb-1">
          Correo (con este vas a entrar a la app para ver calendario, pagos y avisos)
        </label>
        <input
          name="familia_email"
          required
          type="email"
          placeholder="correo@familia.com"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />

        <p className="text-xs font-medium text-gray-500 mt-2">Responsable</p>
        <input name="responsable_nombre" required placeholder="Nombre del responsable" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <select name="responsable_parentesco" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Parentesco...</option>
          <option value="Padre">Padre</option>
          <option value="Madre">Madre</option>
          <option value="Tutor">Tutor</option>
          <option value="Otro">Otro</option>
        </select>
        <input
          name="responsable_telefono"
          required
          placeholder="Teléfono del responsable"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />

        <p className="text-xs font-medium text-gray-500 mt-2">Contacto de emergencia</p>
        <input
          name="contacto_emergencia_nombre"
          placeholder="Nombre (si es distinto al responsable)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="contacto_emergencia_telefono"
          placeholder="Teléfono de emergencia"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />

        <p className="text-xs font-medium text-gray-500 mt-2">Ficha médica</p>
        <select name="tipo_sangre" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Tipo de sangre...</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input name="alergias" placeholder="Alergias (o 'Ninguna')" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input
          name="condiciones_medicas"
          placeholder="Condiciones médicas (asma, etc.)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input name="seguro_medico" placeholder="Seguro médico (o 'Ninguno')" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />

        <label className="flex items-start gap-2 mt-2 text-xs text-gray-600">
          <input type="checkbox" name="consentimiento" required className="mt-0.5 shrink-0" />
          <span>
            Autorizo a {club?.nombre ?? 'el club'} a guardar estos datos (incluyendo información médica) para
            gestionar la participación de mi hijo/a en el club, y entiendo que puedo pedir que se corrijan o
            eliminen en cualquier momento contactando al club.
          </span>
        </label>

        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

        <button disabled={enviando} className="bg-navy text-white text-sm rounded-lg py-2.5 mt-2 disabled:opacity-60">
          {enviando ? 'Enviando…' : 'Enviar registro'}
        </button>
      </form>
    </div>
  )
}
