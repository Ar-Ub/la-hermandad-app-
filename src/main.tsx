import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Header from './components/Header'
import RegistroPublico from './views/RegistroPublico'
import './index.css'

// Link público de registro: la-hermandad-app.../?registro=1 (ver Admin >
// Solicitudes). Es un query param en la raíz a propósito — siempre
// resuelve sin depender de configuración extra de rutas en Cloudflare, y
// deja entrar al padre sin cuenta ni login.
const esRegistroPublico = new URLSearchParams(window.location.search).get('registro') === '1'

function Raiz() {
  if (esRegistroPublico) {
    return (
      <div className="min-h-screen flex items-center justify-center py-6">
        <div className="w-full max-w-[380px] bg-white rounded-[28px] shadow-xl overflow-hidden border border-gray-200">
          <Header categoria="Registro de jugador" nombreUsuario="" />
          <RegistroPublico />
        </div>
      </div>
    )
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Raiz />
  </React.StrictMode>,
)
