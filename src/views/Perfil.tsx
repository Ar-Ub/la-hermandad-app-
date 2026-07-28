import { jugadorMock } from '../data/mockData'

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Perfil() {
  const j = jugadorMock
  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-3">Perfil del jugador</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
          {iniciales(j.nombre)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{j.nombre}</p>
          <p className="text-xs text-gray-500 truncate">
            {j.categoria} · {j.posicion}
          </p>
        </div>
      </div>
      <table className="w-full text-[13px]">
        <tbody>
          <tr>
            <td className="text-gray-500 py-1.5">Asistencia</td>
            <td className="text-right font-medium py-1.5">{j.asistencia_pct}%</td>
          </tr>
          <tr className="border-t border-gray-100">
            <td className="text-gray-500 py-1.5">Partidos jugados</td>
            <td className="text-right font-medium py-1.5">{j.partidos_jugados}</td>
          </tr>
          <tr className="border-t border-gray-100">
            <td className="text-gray-500 py-1.5">Estado mensualidad</td>
            <td className={`text-right font-medium py-1.5 ${j.mensualidad_al_dia ? 'text-green-600' : 'text-red-600'}`}>
              {j.mensualidad_al_dia ? 'Al día' : 'Pendiente'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
