type Props = {
  categoria: string
  nombreUsuario?: string
}

export default function Header({ categoria, nombreUsuario }: Props) {
  return (
    <div className="bg-navy px-5 pt-4 pb-4 flex items-center gap-3">
      <img
        src="/logo.png"
        alt="La Hermandad F.C."
        className="w-9 h-9 rounded-full bg-white shrink-0 object-cover"
      />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium leading-tight truncate">La Hermandad F.C.</p>
        <p className="text-[#B9C2D6] text-xs leading-tight truncate">
          {nombreUsuario ? `${categoria} · Hola, ${nombreUsuario}` : categoria}
        </p>
      </div>
    </div>
  )
}
