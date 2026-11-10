import type { Category, Situation } from "./types.ts";

/**
 * Umbrales y pesos de la recomendación (decisión 0005).
 * Están en un solo archivo para poder ajustarlos y justificarlos.
 */

/** Zona horaria en la que se define "hoy" para fechas límite y edad. */
export const TIME_ZONE = "America/Bogota";

/** Una convocatoria pasa a "por cerrar" cuando faltan estos días o menos. */
export const CLOSING_SOON_DAYS = 7;

/** Antigüedad máxima de la verificación de una convocatoria sin fecha límite. */
export const OPEN_CALL_MAX_VERIFICATION_AGE_DAYS = 30;

/** Por debajo de este número de resultados la respuesta se marca insuficiente. */
export const MIN_RESULTS = 4;

/** Número máximo de recomendaciones que se muestran. */
export const MAX_RESULTS = 5;

/** Máximo de recomendaciones de una misma categoría (diversidad de rutas). */
export const MAX_PER_CATEGORY = 2;

/** Número máximo de razones que acompañan a cada recomendación. */
export const MAX_REASONS = 3;

/** Puntos que suma cada regla de ranking. */
export const SCORE = {
  interest: 3,
  priorityRoute: 2,
  local: 1,
  closingSoon: 1,
} as const;

/** Categorías prioritarias según la situación actual (continuidad de ruta). */
export const PRIORITY_ROUTES: Readonly<Record<Situation, readonly Category[]>> =
  {
    neither: ["training", "subsidy", "entrepreneurship"],
    studying: ["scholarship", "training"],
    working: ["training", "entrepreneurship", "employment"],
    both: ["scholarship", "training"],
  };
