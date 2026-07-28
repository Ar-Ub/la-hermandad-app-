import { IconBell, IconCalendar, IconCard, IconUser, IconShield } from './icons'

export type Vista = 'calendario' | 'pagos' | 'avisos' | 'perfil' | 'admin'

const items: { id: Vista; label: string; Icon: typeof IconBell }[] = [
  { id: 'calendario', label: 'Calendario', Icon: IconCalendar },
  { id: 'pagos', label: 'Pagos', Icon: IconCard },
  { id: 'avisos', label: 'Avisos', Icon: IconBell },
  { id: 'perfil', label: 'Perfil', Icon: IconUser },
]

type Props = {
  activa: Vista
  onCambiar: (v: Vista) => void
  isAdmin?: boolean
}

export default function BottomNav({ activa, onCambiar, isAdmin }: Props) {
  const lista = isAdmin ? [...items, { id: 'admin' as Vista, label: 'Admin', Icon: IconShield }] : items
  return (
    <div className="flex border-t border-gray-200 bg-white">
      {lista.map(({ id, label, Icon }) => {
        const on = activa === id
        return (
          <button
            key={id}
            onClick={() => onCambiar(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${on ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
