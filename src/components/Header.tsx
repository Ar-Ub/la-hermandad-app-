type Props = {
  categoria: string
  nombreUsuario?: string
  nombreClub?: string | null
  logoUrl?: string | null
}

// El nombre/logo del club vienen de la tabla "clubes" (uno por cliente).
// Mientras no se resuelven todavía (justo después de loguearse), se
// muestra "La Hermandad F.C." como respaldo — hoy es, en la práctica, el
// único club real usando la app.
export default function Header({ categoria, nombreUsuario, nombreClub, logoUrl }: Props) {
  return (
    <div className="bg-navy px-5 pt-4 pb-4 flex items-center gap-3">
      <img
        src={logoUrl || '/logo.png'}
        alt={nombreClub ?? 'La Hermandad F.C.'}
        className="w-9 h-9 rounded-full bg-white shrink-0 object-cover"
      />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium leading-tight truncate">{nombreClub ?? 'La Hermandad F.C.'}</p>
        <p className="text-[#B9C2D6] text-xs leading-tight truncate">
          {nombreUsuario ? `${categoria} · Hola, ${nombreUsuario}` : categoria}
        </p>
      </div>
    </div>
  )
}
