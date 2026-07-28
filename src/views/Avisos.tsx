import { avisosMock } from '../data/mockData'

export default function Avisos() {
  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium mb-2">Avisos del club</p>
      {avisosMock.map((a) => (
        <div key={a.id} className="py-2.5 border-t border-gray-100 first:border-t-0">
          <p className="text-sm font-medium">{a.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{a.cuerpo}</p>
          <p className="text-[10px] text-gray-400 mt-1">{a.fecha}</p>
        </div>
      ))}
    </div>
  )
}
