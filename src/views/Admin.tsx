import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Categoria = { id: string; nombre: string }
type JugadorSimple = { id: string; nombre: string }

export default function Admin() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [jugadores, setJugadores] = useState<JugadorSimple[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('categorias')
      .select('id, nombre')
      .then(({ data }) => {
        if (data) setCategorias(data)
      })
    supabase
      .from('jugadores')
      .select('id, nombre')
      .then(({ data }) => {
        if (data) setJugadores(data)
      })
  }, [])

  function avisar(texto: string) {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 3000)
  }

  async function agregarJugador(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const { error } = await supabase.from('jugadores').insert({
      nombre: fd.get('nombre'),
      posicion: fd.get('posicion'),
      categoria_id: fd.get('categoria_id'),
      familia_email: fd.get('familia_email'),
      asistencia_pct: 0,
      partidos_jugados: 0,
    })
    avisar(error ? 'Error: ' + error.message : 'Jugador agregado')
    if (!error) {
      form.reset()
      const { data } = await supabase.from('jugadores').select('id, nombre')
      if (data) setJugadores(data)
    }
  }

  async function registrarPago(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const { error } = await supabase.from('pagos').insert({
      jugador_id: fd.get('jugador_id'),
      mes: fd.get('mes'),
      monto: Number(fd.get('monto')),
      estado: fd.get('estado'),
      fecha_limite: fd.get('fecha_limite'),
    })
    avisar(error ? 'Error: ' + error.message : 'Pago registrado')
    if (!error) form.reset()
  }

  async function publicarAviso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const { error } = await supabase.from('avisos').insert({
      titulo: fd.get('titulo'),
      cuerpo: fd.get('cuerpo'),
    })
    avisar(error ? 'Error: ' + error.message : 'Aviso publicado')
    if (!error) form.reset()
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-6 max-h-[520px] overflow-y-auto">
      {mensaje && <div className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">{mensaje}</div>}

      <form onSubmit={agregarJugador} className="flex flex-col gap-2">
        <p className="text-sm font-medium">Agregar jugador</p>
        <input
          name="nombre"
          required
          placeholder="Nombre del jugador"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input name="posicion" placeholder="Posición" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <select name="categoria_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Categoría...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input
          name="familia_email"
          required
          type="email"
          placeholder="Correo de la familia"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-navy text-white text-sm rounded-lg py-2">Agregar jugador</button>
      </form>

      <form onSubmit={registrarPago} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium">Registrar pago</p>
        <select name="jugador_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Jugador...</option>
          {jugadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nombre}
            </option>
          ))}
        </select>
        <input
          name="mes"
          required
          placeholder="Mes (ej. Agosto 2026)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="monto"
          required
          type="number"
          placeholder="Monto (RD$)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select name="estado" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="vence">Vence</option>
          <option value="pagado">Pagado</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <input name="fecha_limite" required type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button className="bg-navy text-white text-sm rounded-lg py-2">Registrar pago</button>
      </form>

      <form onSubmit={publicarAviso} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium">Publicar aviso</p>
        <input name="titulo" required placeholder="Título" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <textarea
          name="cuerpo"
          required
          placeholder="Mensaje"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[70px]"
        />
        <button className="bg-navy text-white text-sm rounded-lg py-2">Publicar aviso</button>
      </form>
    </div>
  )
}
