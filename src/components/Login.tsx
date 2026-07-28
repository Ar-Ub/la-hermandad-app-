import { useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabaseClient'

type Props = {
  onDemoLogin: () => void
}

// Login sin contraseña (magic link): la familia recibe un correo con un
// enlace y entra directo. No hay contraseñas que la gente olvide, y no
// hay que construir pantalla de "recuperar contraseña".
export default function Login({ onDemoLogin }: Props) {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enviarEnlace(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setEnviado(true)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] px-6 text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center text-lg font-medium">
        LH
      </div>
      <div>
        <p className="text-base font-medium">La Hermandad F.C.</p>
        <p className="text-sm text-gray-500">Portal de familias y jugadores</p>
      </div>

      {!supabaseConfigured && (
        <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
          Supabase no está configurado todavía (ver README). Puedes explorar la
          interfaz con datos de muestra.
          <button
            onClick={onDemoLogin}
            className="block w-full mt-2 bg-navy text-white text-sm rounded-lg py-2"
          >
            Entrar con datos de muestra
          </button>
        </div>
      )}

      {supabaseConfigured && !enviado && (
        <form onSubmit={enviarEnlace} className="w-full flex flex-col gap-2">
          <input
            type="email"
            required
            placeholder="correo@familia.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full bg-navy text-white text-sm rounded-lg py-2">
            Enviar enlace de acceso
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}

      {supabaseConfigured && enviado && (
        <p className="text-sm text-gray-600">
          Revisa tu correo, te enviamos un enlace para entrar sin contraseña.
        </p>
      )}
    </div>
  )
}
