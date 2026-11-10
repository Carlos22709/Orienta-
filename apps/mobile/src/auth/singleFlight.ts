/**
 * Envuelve una función asíncrona para que, mientras una llamada esté en curso,
 * las demás reciban la misma promesa en lugar de iniciar otra. Los argumentos
 * de las llamadas que se suman a una en curso se ignoran.
 *
 * Es la base de la cola de silent refresh (decisión 0002): si varias
 * peticiones reciben 401 a la vez, solo se hace una renovación de sesión.
 * Esto importa porque Supabase rota el refresh_token en cada uso.
 */
export function singleFlight<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return (...args) => {
    if (!inFlight) {
      inFlight = fn(...args).finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  };
}
