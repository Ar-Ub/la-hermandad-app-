// Cuando esta app se despliega para un club específico (un proyecto de
// Cloudflare Workers distinto por club — todos gratis en *.workers.dev,
// sin necesidad de dominio propio), la variable de entorno VITE_CLUB_SLUG
// le dice a la app cuál es "su" club por defecto. Así:
//   - la pantalla de antes de loguearse puede mostrar la marca del club
//     en vez de la genérica de Ciclo Asiste, y
//   - el link de registro público de ese despliegue no necesita llevar
//     "?club=slug" en la URL.
// Si no se configura (como hoy en el despliegue de La Hermandad), la app
// sigue funcionando exactamente igual que antes.
export const CLUB_SLUG_DEPLOYMENT = (import.meta.env.VITE_CLUB_SLUG as string | undefined) || undefined
