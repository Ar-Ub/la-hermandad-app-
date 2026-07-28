import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// La app funciona con datos de muestra si no hay credenciales de Supabase
// configuradas todavia (ver .env.example). Esto permite correr `npm run dev`
// y ver la interfaz completa antes de crear el proyecto real en supabase.com.
export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
