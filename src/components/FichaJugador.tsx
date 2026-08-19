import { calcularEdad, type ResumenJugador } from '../lib/estadisticas'

// Ficha profesional del jugador — el equivalente a la hoja "Ficha del
// Jugador" del Excel, exportada. Sin colores de comparación (eso es solo
// uso interno del cuerpo técnico); esto es lo que ven las familias.

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

type Props = {
  nombre: string
  categoria: string
  posicion: string
  fechaNacimiento?: string | null
  fotoUrl?: string | null
  resumen: ResumenJugador
  responsableNombre?: string | null
  responsableParentesco?: string | null
  responsableTelefono?: string | null
  contactoEmergenciaNombre?: string | null
  contactoEmergenciaTelefono?: string | null
  tipoSangre?: string | null
  alergias?: string | null
  condicionesMedicas?: string | null
  seguroMedico?: string | null
}

export default function FichaJugador({
  nombre,
  categoria,
  posicion,
  fechaNacimiento,
  fotoUrl,
  resumen,
  responsableNombre,
  responsableParentesco,
  responsableTelefono,
  contactoEmergenciaNombre,
  contactoEmergenciaTelefono,
  tipoSangre,
  alergias,
  condicionesMedicas,
  seguroMedico,
}: Props) {
  const edad = calcularEdad(fechaNacimiento)
  const hayResponsable = responsableNombre || responsableTelefono || contactoEmergenciaNombre || contactoEmergenciaTelefono
  const hayFichaMedica = tipoSangre || alergias || condicionesMedicas || seguroMedico

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-3 mb-4">
        {fotoUrl ? (
          <img src={fotoUrl} alt={nombre} className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-medium shrink-0">
            {iniciales(nombre)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-base font-medium truncate">{nombre}</p>
          <p className="text-xs text-gray-500 truncate">
            {categoria} · {posicion || 'Sin posición'}
          </p>
          {edad != null && <p className="text-xs text-gray-400">{edad} años</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg py-2.5 text-center">
          <p className="text-lg font-semibold">{resumen.partidosJugados}</p>
          <p className="text-[10px] text-gray-500">Partidos</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2.5 text-center">
          <p className="text-lg font-semibold">{resumen.goles}</p>
          <p className="text-[10px] text-gray-500">Goles</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2.5 text-center">
          <p className="text-lg font-semibold">{resumen.asistencias}</p>
          <p className="text-[10px] text-gray-500">Asistencias</p>
        </div>
      </div>

      <table className="w-full text-[13px] mb-4">
        <tbody>
          <tr>
            <td className="text-gray-500 py-1.5">Asistencia a entrenamientos</td>
            <td className="text-right font-medium py-1.5">{resumen.asistenciaPct}%</td>
          </tr>
          {resumen.promedioActuacion != null && (
            <tr className="border-t border-gray-100">
              <td className="text-gray-500 py-1.5">Actuación promedio</td>
              <td className="text-right font-medium py-1.5">{resumen.promedioActuacion} / 10</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="text-sm font-medium mb-2">Historial de partidos</p>
      {resumen.historialPartidos.length === 0 ? (
        <p className="text-xs text-gray-400">Todavía no hay partidos registrados.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto mb-4">
          {resumen.historialPartidos.map((h, i) => {
            const d = new Date(h.fecha + 'T00:00:00')
            return (
              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                <div className="w-8 text-center shrink-0">
                  <p className="text-[9px] text-gray-400">{meses[d.getMonth()]}</p>
                  <p className="text-sm font-medium">{d.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    vs {h.rival} · {h.resultadoEquipo}
                  </p>
                  <p className="text-gray-500 truncate">
                    {h.fase}
                    {h.golesJugador > 0 && ` · ${h.golesJugador} gol${h.golesJugador > 1 ? 'es' : ''}`}
                    {h.asistenciasJugador > 0 && ` · ${h.asistenciasJugador} asist.`}
                    {h.actuacion != null && ` · ${h.actuacion}/10`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hayResponsable && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Responsable</p>
          <table className="w-full text-[13px]">
            <tbody>
              {responsableNombre && (
                <tr>
                  <td className="text-gray-500 py-1.5">Nombre</td>
                  <td className="text-right font-medium py-1.5">
                    {responsableNombre}
                    {responsableParentesco ? ` (${responsableParentesco})` : ''}
                  </td>
                </tr>
              )}
              {responsableTelefono && (
                <tr className="border-t border-gray-100">
                  <td className="text-gray-500 py-1.5">Teléfono</td>
                  <td className="text-right font-medium py-1.5">{responsableTelefono}</td>
                </tr>
              )}
              {contactoEmergenciaNombre && (
                <tr className="border-t border-gray-100">
                  <td className="text-gray-500 py-1.5">Emergencia</td>
                  <td className="text-right font-medium py-1.5">{contactoEmergenciaNombre}</td>
                </tr>
              )}
              {contactoEmergenciaTelefono && (
                <tr className="border-t border-gray-100">
                  <td className="text-gray-500 py-1.5">Tel. emergencia</td>
                  <td className="text-right font-medium py-1.5">{contactoEmergenciaTelefono}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {hayFichaMedica && (
        <div>
          <p className="text-sm font-medium mb-2">Ficha médica</p>
          <table className="w-full text-[13px]">
            <tbody>
              {tipoSangre && (
                <tr>
                  <td className="text-gray-500 py-1.5">Tipo de sangre</td>
                  <td className="text-right font-medium py-1.5">{tipoSangre}</td>
                </tr>
              )}
              {alergias && (
                <tr className="border-t border-gray-100">
                  <td className="text-gray-500 py-1.5 align-top">Alergias</td>
                  <td className="text-right font-medium py-1.5">{alergias}</td>
                </tr>
              )}
              {condicionesMedicas && (
                <tr className="border-t border-gray-100">
                  <td className="text-gray-500 py-1.5 align-top">Condiciones</td>
                  <td className="text-right font-medium py-1.5">{condicionesMedicas}</td>
                </tr>
              )}
              {seguroMedico && (
                <tr className="border-t border-gray-100">
                  <td className="text-gray-500 py-1.5">Seguro médico</td>
                  <td className="text-right font-medium py-1.5">{seguroMedico}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
