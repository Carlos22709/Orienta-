/**
 * Variables de entorno públicas de la app.
 *
 * Expo solo reemplaza en el bundle las variables EXPO_PUBLIC_* cuando se leen
 * con acceso directo (process.env.EXPO_PUBLIC_X), por eso no se recorre
 * process.env de forma dinámica. Si falta una variable no se lanza un error:
 * se devuelve null y la pantalla muestra un estado de configuración faltante,
 * para que la app nunca se cierre por esto.
 *
 * Todas son públicas por diseño: la clave publishable de Supabase puede ir en
 * la app. Nunca pongas aquí la clave secret.
 */
function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readApiUrl(): string | null {
  const value = clean(process.env.EXPO_PUBLIC_API_URL);
  if (!value) {
    return null;
  }
  // fetchBaseQuery concatena rutas relativas: la base debe terminar en "/".
  return value.endsWith('/') ? value : `${value}/`;
}

function readSupabaseUrl(): string | null {
  // Las rutas de Supabase Auth se agregan con "/auth/v1/...".
  return clean(process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '') ?? null;
}

export const env = {
  apiUrl: readApiUrl(),
  supabaseUrl: readSupabaseUrl(),
  supabasePublishableKey: clean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
} as const;
