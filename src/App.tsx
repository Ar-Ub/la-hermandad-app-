import { useEffect, useState } from 'react'
import Header from './components/Header'
import BottomNav, { Vista } from './components/BottomNav'
import Login from './components/Login'
import Calendario from './views/Calendario'
import Pagos from './views/Pagos'
import Avisos from './views/Avisos'
import Perfil from './views/Perfil'
import Admin from './views/Admin'
import { supabase, supabaseConfigured } from './lib/supabaseClient'
import { useJugadoresFamilia } from './lib/useJugadoresFamilia'

export default function App() {
  const [vista, setVista] = useState<Vista>('calendario')
  const [autenticado, setAutenticado] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clubSlug, setClubSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAutenticado(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(Boolean(session))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !autenticado) return
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email
      if (!email) return
      supabase!
        .from('administradores')
        .select('club_id, clubes(slug)')
        .eq('email', email)
        .limit(1)
        .then(({ data: admin }) => {
          const fila = admin?.[0] as any
          setIsAdmin(Boolean(fila))
          setClubSlug(fila?.clubes?.slug ?? null)
        })
    })
  }, [autenticado])

  // Una familia puede tener más de un hijo en el club (hermanos en
  // categorías distintas). Este hook trae todos los jugadores ligados al
  // correo de la sesión y deja elegir cuál ver.
  const { jugadores, jugadorActual, jugadorId, setJugadorId } = useJugadoresFamilia(autenticado)

  const dentro = autenticado || !supabaseConfigured
  const nombreUsuario = jugadorActual?.nombre.split(' ')[0]
  const categoria = jugadorActual?.categoria || 'Sub-13'

  return (
    <div className="min-h-screen flex items-center justify-center py-6">
      <div className="w-full max-w-[380px] bg-white rounded-[28px] shadow-xl overflow-hidden border border-gray-200">
        {!dentro ? (
          <>
            <Header categoria="Portal de familias" nombreUsuario="" />
            <Login onDemoLogin={() => setAutenticado(true)} />
          </>
        ) : (
          <>
            <Header
              categoria={vista === 'admin' ? 'Panel de administrador' : categoria}
              nombreUsuario={vista === 'admin' ? undefined : nombreUsuario ?? 'Frank'}
            />

            {vista !== 'admin' && jugadores.length > 1 && (
              <div className="px-5 pt-3 flex gap-2 overflow-x-auto">
                {jugadores.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => setJugadorId(j.id)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
                      j.id === jugadorId
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {j.nombre.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {vista === 'calendario' && <Calendario categoriaId={jugadorActual?.categoriaId ?? null} />}
            {vista === 'pagos' && <Pagos jugadorId={jugadorId} />}
            {vista === 'avisos' && <Avisos categoriaId={jugadorActual?.categoriaId ?? null} />}
            {vista === 'perfil' && <Perfil jugadorId={jugadorId} />}
            {vista === 'admin' && isAdmin && <Admin clubSlug={clubSlug} />}
            <BottomNav activa={vista} onCambiar={setVista} isAdmin={isAdmin} />
          </>
        )}
      </div>
    </div>
  )
}
