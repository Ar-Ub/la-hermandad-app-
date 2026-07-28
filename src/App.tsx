import { useEffect, useState } from 'react'
import Header from './components/Header'
import BottomNav, { Vista } from './components/BottomNav'
import Login from './components/Login'
import Calendario from './views/Calendario'
import Pagos from './views/Pagos'
import Avisos from './views/Avisos'
import Perfil from './views/Perfil'
import { supabase, supabaseConfigured } from './lib/supabaseClient'

export default function App() {
  const [vista, setVista] = useState<Vista>('calendario')
  const [autenticado, setAutenticado] = useState(false)

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

  const dentro = autenticado || !supabaseConfigured

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
            <Header categoria="Sub-13" nombreUsuario="Frank" />
            {vista === 'calendario' && <Calendario />}
            {vista === 'pagos' && <Pagos />}
            {vista === 'avisos' && <Avisos />}
            {vista === 'perfil' && <Perfil />}
            <BottomNav activa={vista} onCambiar={setVista} />
          </>
        )}
      </div>
    </div>
  )
}
