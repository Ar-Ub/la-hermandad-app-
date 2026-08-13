import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { resumenDeJugador, type Partido, type PartidoJugador, type Entrenamiento, type EntrenamientoAsistencia } from '../lib/estadisticas'
import FichaJugador from '../components/FichaJugador'
import AdminPartidos from './admin/AdminPartidos'
import AdminEntrenamientos from './admin/AdminEntrenamientos'
import AdminEstadisticas from './admin/AdminEstadisticas'

type Categoria = { id: string; nombre: string }

type JugadorDetalle = {
  id: string
  nombre: string
  categoria: string
  categoria_id: string | null
  posicion: string
  fecha_nacimiento: string | null
  foto_url: string | null
  asistencia_pct: number
  partidos_jugados: number
  familia_email: string
  estadoPago: string | null
  mesPago: string | null
}

type ReportePago = {
  id: string
  mes: string
  referencia: string | null
  nota: string | null
  estado: string
  jugadores: { nombre: string } | null
}

type Seccion = 'general' | 'partidos' | 'entrenamientos' | 'estadisticas'

const estilosPago: Record<string, string> = {
  pagado: 'bg-green-100 text-green-700',
  vence: 'bg-amber-100 text-amber-700',
  atrasado: 'bg-red-100 text-red-700',
}

const etiquetaPago: Record<string, string> = {
  pagado: 'Pagado',
  vence: 'Vence',
  atrasado: 'Atrasado',
}

const secciones: { id: Seccion; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'partidos', label: 'Partidos' },
  { id: 'entrenamientos', label: 'Entrenos' },
  { id: 'estadisticas', label: 'Stats' },
]

export default function Admin() {
  const [seccion, setSeccion] = useState<Seccion>('general')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [jugadoresDetalle, setJugadoresDetalle] = useState<JugadorDetalle[]>([])
  const [reportes, setReportes] = useState<ReportePago[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [fichaAbierta, setFichaAbierta] = useState<string | null>(null)

  const [partidos, setPartidos] = useState<Partido[]>([])
  const [partidoJugadores, setPartidoJugadores] = useState<PartidoJugador[]>([])
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([])
  const [asistencias, setAsistencias] = useState<EntrenamientoAsistencia[]>([])

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('categorias')
      .select('id, nombre')
      .then(({ data }) => {
        if (data) setCategorias(data)
      })
    cargarJugadoresDetalle()
    cargarReportes()
    cargarEstadisticas()
  }, [])

  async function cargarJugadoresDetalle() {
    if (!supabase) return
    const { data: jugadoresData } = await supabase
      .from('jugadores')
      .select(
        'id, nombre, posicion, categoria_id, fecha_nacimiento, foto_url, asistencia_pct, partidos_jugados, familia_email, categorias(nombre)'
      )
      .order('nombre', { ascending: true })

    const { data: pagosData } = await supabase
      .from('pagos')
      .select('jugador_id, estado, mes, fecha_limite')
      .order('fecha_limite', { ascending: false })

    // Nos quedamos con el pago más reciente de cada jugador (el primero
    // que aparece, ya que la lista viene ordenada por fecha descendente).
    const ultimoPago = new Map<string, { estado: string; mes: string }>()
    ;(pagosData ?? []).forEach((p: any) => {
      if (!ultimoPago.has(p.jugador_id)) {
        ultimoPago.set(p.jugador_id, { estado: p.estado, mes: p.mes })
      }
    })

    const detalle: JugadorDetalle[] = (jugadoresData ?? []).map((j: any) => ({
      id: j.id,
      nombre: j.nombre,
      categoria: j.categorias?.nombre ?? '',
      categoria_id: j.categoria_id ?? null,
      posicion: j.posicion ?? '',
      fecha_nacimiento: j.fecha_nacimiento ?? null,
      foto_url: j.foto_url ?? null,
      asistencia_pct: j.asistencia_pct ?? 0,
      partidos_jugados: j.partidos_jugados ?? 0,
      familia_email: j.familia_email,
      estadoPago: ultimoPago.get(j.id)?.estado ?? null,
      mesPago: ultimoPago.get(j.id)?.mes ?? null,
    }))
    setJugadoresDetalle(detalle)
  }

  async function cargarReportes() {
    if (!supabase) return
    const { data } = await supabase
      .from('reportes_pago')
      .select('id, mes, referencia, nota, estado, jugadores(nombre)')
      .order('created_at', { ascending: false })
    if (data) setReportes(data as any)
  }

  async function cargarEstadisticas() {
    if (!supabase) return
    const [{ data: p }, { data: pj }, { data: e }, { data: a }] = await Promise.all([
      supabase.from('partidos').select('*').order('fecha', { ascending: false }),
      supabase.from('partido_jugadores').select('*'),
      supabase.from('entrenamientos').select('*').order('fecha', { ascending: false }),
      supabase.from('entrenamiento_asistencias').select('*'),
    ])
    if (p) setPartidos(p as Partido[])
    if (pj) setPartidoJugadores(pj as PartidoJugador[])
    if (e) setEntrenamientos(e as Entrenamiento[])
    if (a) setAsistencias(a as EntrenamientoAsistencia[])
  }

  async function confirmarReporte(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('reportes_pago').update({ estado: 'confirmado' }).eq('id', id)
    avisar(error ? 'Error: ' + error.message : 'Reporte confirmado')
    if (!error) cargarReportes()
  }

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
      fecha_nacimiento: fd.get('fecha_nacimiento') || null,
      foto_url: fd.get('foto_url') || null,
      asistencia_pct: 0,
      partidos_jugados: 0,
    })
    avisar(error ? 'Error: ' + error.message : 'Jugador agregado')
    if (!error) {
      form.reset()
      cargarJugadoresDetalle()
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
    if (!error) {
      form.reset()
      cargarJugadoresDetalle()
    }
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

  const jugadoresFiltrados = jugadoresDetalle.filter((j) =>
    j.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const jugadoresBasicos = jugadoresDetalle.map((j) => ({ id: j.id, nombre: j.nombre, categoria_id: j.categoria_id }))

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-3 flex gap-1.5 overflow-x-auto">
        {secciones.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
              seccion === s.id ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 flex flex-col gap-6 max-h-[520px] overflow-y-auto">
        {mensaje && <div className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">{mensaje}</div>}

        {seccion === 'general' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Jugadores del club ({jugadoresDetalle.length})</p>
              </div>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar jugador..."
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs mb-2"
              />
              {jugadoresFiltrados.length === 0 && (
                <p className="text-xs text-gray-400">
                  {jugadoresDetalle.length === 0 ? 'Todavía no hay jugadores registrados.' : 'Sin resultados.'}
                </p>
              )}
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {jugadoresFiltrados.map((j) => (
                  <div key={j.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{j.nombre}</p>
                        <p className="text-gray-500 truncate">
                          {j.categoria || 'Sin categoría'} · {j.posicion || 'Sin posición'} · Asistencia {j.asistencia_pct}% ·{' '}
                          {j.partidos_jugados} partidos
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md ${j.estadoPago ? estilosPago[j.estadoPago] ?? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                          {j.estadoPago ? etiquetaPago[j.estadoPago] ?? j.estadoPago : 'Sin pagos'}
                        </span>
                        <button
                          onClick={() => setFichaAbierta(fichaAbierta === j.id ? null : j.id)}
                          className="text-blue-600 font-medium"
                        >
                          {fichaAbierta === j.id ? 'Cerrar' : 'Ficha'}
                        </button>
                      </div>
                    </div>
                    {fichaAbierta === j.id && (
                      <div className="mt-2 -mx-3 border-t border-gray-200 bg-white rounded-b-lg">
                        <FichaJugador
                          nombre={j.nombre}
                          categoria={j.categoria}
                          posicion={j.posicion}
                          fechaNacimiento={j.fecha_nacimiento}
                          fotoUrl={j.foto_url}
                          resumen={resumenDeJugador(j.id, partidos, partidoJugadores, entrenamientos, asistencias)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium mb-2">Reportes de pago de familias</p>
              {reportes.length === 0 && <p className="text-xs text-gray-400">No hay reportes todavía.</p>}
              <div className="flex flex-col gap-2">
                {reportes.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <p className="font-medium">
                      {r.jugadores?.nombre ?? 'Jugador'} · {r.mes}
                    </p>
                    {r.referencia && <p className="text-gray-500">Ref: {r.referencia}</p>}
                    {r.nota && <p className="text-gray-500">{r.nota}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          r.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.estado === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                      </span>
                      {r.estado !== 'confirmado' && (
                        <button onClick={() => confirmarReporte(r.id)} className="text-blue-600 font-medium">
                          Confirmar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={agregarJugador} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
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
              <label className="text-[11px] text-gray-500 -mb-1">Fecha de nacimiento (para calcular la edad)</label>
              <input name="fecha_nacimiento" type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <label className="text-[11px] text-gray-500 -mb-1">
                Foto (enlace directo, ej. desde Google Drive — opcional)
              </label>
              <input name="foto_url" placeholder="https://..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button className="bg-navy text-white text-sm rounded-lg py-2">Agregar jugador</button>
            </form>

            <form onSubmit={registrarPago} className="flex flex-col gap-2 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium">Registrar pago</p>
              <select name="jugador_id" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Jugador...</option>
                {jugadoresDetalle.map((j) => (
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
          </>
        )}

        {seccion === 'partidos' && (
          <AdminPartidos
            categorias={categorias}
            jugadores={jugadoresBasicos}
            partidos={partidos}
            partidoJugadores={partidoJugadores}
            onRecargar={() => {
              cargarEstadisticas()
              cargarJugadoresDetalle()
            }}
            avisar={avisar}
          />
        )}

        {seccion === 'entrenamientos' && (
          <AdminEntrenamientos
            categorias={categorias}
            jugadores={jugadoresBasicos}
            entrenamientos={entrenamientos}
            asistencias={asistencias}
            onRecargar={() => {
              cargarEstadisticas()
              cargarJugadoresDetalle()
            }}
            avisar={avisar}
          />
        )}

        {seccion === 'estadisticas' && (
          <AdminEstadisticas categorias={categorias} partidos={partidos} entrenamientos={entrenamientos} asistencias={asistencias} />
        )}
      </div>
    </div>
  )
}
