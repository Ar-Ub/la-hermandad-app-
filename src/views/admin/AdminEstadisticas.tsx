import {
  resumenPorCategoria,
  resumenFasesYCompeticion,
  historialVsRivales,
  type Partido,
  type Entrenamiento,
  type EntrenamientoAsistencia,
} from '../../lib/estadisticas'

// Equivalente a las hojas "Resumen por Categoría", "Fases y Competición"
// e "Historial vs Rivales" del Excel — solo uso interno del cuerpo
// técnico (por eso vive dentro de Admin, no se le muestra a las familias).

type Categoria = { id: string; nombre: string }

type Props = {
  categorias: Categoria[]
  partidos: Partido[]
  entrenamientos: Entrenamiento[]
  asistencias: EntrenamientoAsistencia[]
}

function claseSemaforo(valor: number, valores: number[]): string {
  if (valores.length < 2) return ''
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  if (max === min) return ''
  if (valor === max) return 'text-green-600 font-semibold'
  if (valor === min) return 'text-red-600'
  return ''
}

export default function AdminEstadisticas({ categorias, partidos, entrenamientos, asistencias }: Props) {
  const resumen = resumenPorCategoria(categorias, partidos, entrenamientos, asistencias)
  const fases = resumenFasesYCompeticion(categorias, partidos)
  const { porRival, rivalMasEnfrentado } = historialVsRivales(partidos)

  const asistenciaValores = resumen.map((r) => r.asistenciaPromedioPct)
  const golesValores = resumen.map((r) => r.golesFavor)
  const rivalPartidosValores = porRival.map((r) => r.partidosJugados)
  const rivalGolesValores = porRival.map((r) => r.golesFavor)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Resumen por categoría</p>
        {resumen.length === 0 ? (
          <p className="text-xs text-gray-400">Todavía no hay categorías o partidos registrados.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {resumen.map((r) => (
              <div key={r.categoriaId} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <p className="font-medium mb-1">{r.categoriaNombre}</p>
                <p className="text-gray-500">
                  {r.partidosJugados} partidos · {r.ganados}G {r.empatados}E {r.perdidos}P ·{' '}
                  <span className={claseSemaforo(r.golesFavor, golesValores)}>{r.golesFavor} GF</span>
                  {' / '}
                  {r.golesContra} GC
                </p>
                <p className="text-gray-500">
                  Asistencia a entrenamientos:{' '}
                  <span className={claseSemaforo(r.asistenciaPromedioPct, asistenciaValores)}>
                    {r.asistenciaPromedioPct}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium mb-2">Fases y competición</p>
        {fases.every((f) => f.totalPartidos === 0) ? (
          <p className="text-xs text-gray-400">Todavía no hay partidos registrados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {fases
              .filter((f) => f.totalPartidos > 0)
              .map((f) => (
                <div key={f.categoriaId} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                  <p className="font-medium mb-1">
                    {f.categoriaNombre} · {f.totalPartidos} partidos en total
                  </p>
                  {f.porFase.map((pf) => (
                    <p key={pf.fase} className="text-gray-500">
                      {pf.fase}: {pf.partidos} partido{pf.partidos > 1 ? 's' : ''} · promedio {pf.promedioGolesFavor} goles a favor
                    </p>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium mb-2">Historial vs rivales</p>
        {porRival.length === 0 ? (
          <p className="text-xs text-gray-400">Todavía no hay partidos registrados.</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">
              Rival más enfrentado: <span className="font-medium text-gray-700">{rivalMasEnfrentado}</span>
            </p>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {porRival.map((r) => (
                <div key={r.rival} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                  <p className="font-medium">
                    {r.rival} ·{' '}
                    <span className={claseSemaforo(r.partidosJugados, rivalPartidosValores)}>
                      {r.partidosJugados} partido{r.partidosJugados > 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="text-gray-500">
                    {r.ganados}G {r.empatados}E {r.perdidos}P ·{' '}
                    <span className={claseSemaforo(r.golesFavor, rivalGolesValores)}>{r.golesFavor} GF</span>
                    {' / '}
                    {r.golesContra} GC
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
