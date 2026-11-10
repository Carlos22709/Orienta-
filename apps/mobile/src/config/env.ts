/**
 * Variables de entorno públicas de la app.
 *
 * Expo solo reemplaza en el bundle las variables EXPO_PUBLIC_* cuando se leen
 * con acceso directo (process.env.EXPO_PUBLIC_X), por eso no se recorre
 * process.env de forma dinámica. Si falta una variable no se lanza un error:
 * se devuelve null y la pantalla muestra un estado de configuración faltante,
 * para que la app nunca se cierre por esto.
 */
function readApiUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) {
    return null;
  }
  // fetchBaseQuery concatena rutas relativas: la base debe terminar en "/".
  return value.endsWith('/') ? value : `${value}/`;
}

export const env = {
  apiUrl: readApiUrl(),
} as const;
