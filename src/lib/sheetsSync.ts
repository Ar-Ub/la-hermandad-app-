// Respaldo automático hacia Google Sheets (gratis). Cada vez que se guarda
// algo real en Supabase, se manda también una copia al Sheet configurado
// en sheets/Code.gs (ver ese archivo para instrucciones de instalación).
//
// Diseñado para nunca romper la app: si el Sheet no está configurado, o si
// la llamada falla (sin internet, URL mal pegada, etc.), simplemente se
// ignora y la app sigue funcionando normal contra Supabase.

const WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined
const WEBHOOK_TOKEN = import.meta.env.VITE_SHEETS_WEBHOOK_TOKEN as string | undefined

export const sheetsConfigured = Boolean(WEBHOOK_URL && WEBHOOK_TOKEN)

function enviar(body: Record<string, unknown>) {
  if (!sheetsConfigured) return
  try {
    // no-cors: no necesitamos leer la respuesta, solo que el dato llegue.
    // El body se manda como texto plano a propósito (evita el preflight
    // CORS que Apps Script no maneja bien).
    fetch(WEBHOOK_URL as string, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: WEBHOOK_TOKEN, ...body }),
    }).catch(() => {
      // Sin conexión o Sheets caído: no bloquea la app.
    })
  } catch {
    // Nunca debe romper el flujo principal de guardado en Supabase.
  }
}

/** Guarda o actualiza una fila (por "id") en la pestaña `tabla` del Sheet. */
export function sincronizarFila(tabla: string, datos: Record<string, unknown>) {
  enviar({ accion: 'upsert', tabla, datos })
}

/** Elimina la fila con ese id de la pestaña `tabla`. */
export function eliminarFilaSheets(tabla: string, id: string) {
  enviar({ accion: 'eliminar', tabla, id })
}

/** Reemplaza todo el contenido de la pestaña `tabla` con estas filas (para resúmenes calculados, como la Ficha por jugador). */
export function reemplazarTablaCompleta(tabla: string, filas: Record<string, unknown>[]) {
  enviar({ accion: 'reemplazar_todo', tabla, filas })
}
