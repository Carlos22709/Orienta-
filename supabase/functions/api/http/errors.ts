/**
 * Formato único de error de la API: { error, message, ...extra }.
 * `error` es un código estable para la app; `message` es texto en lenguaje
 * claro que se puede mostrar y anunciar al lector de pantalla.
 */
export function errorBody(
  error: string,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return { error, message, ...extra };
}
