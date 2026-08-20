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
import { CLUB_SLUG_DEPLOYMENT } from './lib/clubConfig'

export default function App() {
  const [vista, setVista] = useState<Vista>('calendario')
  const [autenticado, setAutenticado] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clubSlug, setClubSlug] = useState<string | null>(null)
  const [clubAdmin, setClubAdmin] = useState<{ nombre: string; logo_url: string | null } | null>(null)
  const [clubPreLogin, setClubPreLogin] = useState<{ nombre: string; logo_url: string | null } | null>(null)

  // Si este despliegue es el propio de un club (VITE_CLUB_SLUG en
  // Cloudflare), muestra su marca desde antes de loguearse. Si no está
  // configurado, se queda con la marca genérica de Ciclo Asiste.
  useEffect(() => {
    if (!supabase || !CLUB_SLUG_DEPLOYMENT) return
    supabase
      .from('clubes')
      .select('nombre, logo_url')
      .eq('slug', CLUB_SLUG_DEPLOYMENT)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setClubPreLogin(data)
      })
  }, [])

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
        .select('club_id, clubes(slug, nombre, logo_url)')
        .eq('email', email)
        .limit(1)
        .then(({ data: admin }) => {
          const fila = admin?.[0] as any
          setIsAdmin(Boolean(fila))
          setClubSlug(fila?.clubes?.slug ?? null)
          setClubAdmin(fila?.clubes ? { nombre: fila.clubes.nombre, logo_url: fila.clubes.logo_url } : null)
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

  // Qué club mostrar en el Header: si estás en la pestaña Admin, el club
  // del que eres admin; si no, el club del jugador que estás viendo.
  const clubActivo =
    vista === 'admin' && isAdmin
      ? clubAdmin
      : jugadorActual
        ? { nombre: jugadorActual.clubNombre, logo_url: jugadorActual.clubLogoUrl }
        : null

  return (
    <div className="min-h-screen flex items-center justify-center py-6">
      <div className="w-full max-w-[380px] bg-white rounded-[28px] shadow-xl overflow-hidden border border-gray-200">
        {!dentro ? (
          <>
            <Header
              categoria="Portal de familias"
              nombreUsuario=""
              nombreClub={clubPreLogin?.nombre ?? 'Ciclo Asiste'}
              logoUrl={clubPreLogin?.logo_url ?? '/ciclo-asiste-logo.svg'}
            />
            <Login onDemoLogin={() => setAutenticado(true)} clubNombre={clubPreLogin?.nombre} logoUrl={clubPreLogin?.logo_url} />
          </>
        ) : (
          <>
            <Header
              categoria={vista === 'admin' ? 'Panel de administrador' : categoria}
              nombreUsuario={vista === 'admin' ? undefined : nombreUsuario ?? 'Frank'}
              nombreClub={clubActivo?.nombre}
              logoUrl={clubActivo?.logo_url}
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
