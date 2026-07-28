import { pagosMock } from '../data/mockData'

const estilosEstado: Record<string, string> = {
  pagado: 'bg-green-100 text-green-700',
  vence: 'bg-amber-100 text-amber-700',
  atrasado: 'bg-red-100 text-red-700',
}

function formatoRD(monto: number) {
  return 'RD$' + monto.toLocaleString('es-DO')
}

export default function Pagos() {
  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-2">Estado de mensualidad</p>
      <div className="flex flex-col gap-3">
        {pagosMock.map((p) => (
          <div key={p.id} className="bg-gray-50 rounded-xl px-3.5 py-3">
            <p className="text-xs text-gray-500">{p.mes}</p>
            <p className="text-xl font-medium mt-0.5">{formatoRD(p.monto)}</p>
            <span className={`inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-md ${estilosEstado[p.estado]}`}>
              {p.estado === 'pagado'
                ? 'Pagado · ' + new Date(p.fecha_limite).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
                : 'Vence ' + new Date(p.fecha_limite).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 bg-navy text-white text-sm rounded-lg py-2.5">
        Reportar pago
      </button>
    </div>
  )
}
