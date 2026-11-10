import {
  CLOSING_SOON_DAYS,
  OPEN_CALL_MAX_VERIFICATION_AGE_DAYS,
} from "./constants.ts";
import { DAY_MS, daysBetween, toLocalDate } from "./dates.ts";
import type { OpportunityForRanking } from "./types.ts";

/**
 * Estado de vigencia de una oportunidad (decisión 0005, sección 1).
 * - open: vigente.
 * - closing_soon: vigente y cierra en CLOSING_SOON_DAYS días o menos.
 * - closed: no vigente; nunca se recomienda.
 */
export type Validity =
  | { kind: "open" }
  | { kind: "closing_soon"; daysLeft: number }
  | { kind: "closed" };

export function evaluateValidity(
  opportunity: Pick<
    OpportunityForRanking,
    "status" | "deadline" | "verifiedAt"
  >,
  now: Date,
): Validity {
  if (opportunity.status !== "active") return { kind: "closed" };

  if (opportunity.deadline !== null) {
    // "Hoy" es el día calendario en Bogotá: la fecha límite de hoy aún es vigente.
    const daysLeft = daysBetween(toLocalDate(now), opportunity.deadline);
    if (daysLeft < 0) return { kind: "closed" };
    if (daysLeft <= CLOSING_SOON_DAYS) {
      return { kind: "closing_soon", daysLeft };
    }
    return { kind: "open" };
  }

  // Convocatoria abierta: solo es confiable si se verificó recientemente.
  // Si verifiedAt no es una fecha válida, la comparación con NaN da false
  // y la oportunidad se trata como no vigente.
  const verificationAgeMs = now.getTime() -
    new Date(opportunity.verifiedAt).getTime();
  return verificationAgeMs <= OPEN_CALL_MAX_VERIFICATION_AGE_DAYS * DAY_MS
    ? { kind: "open" }
    : { kind: "closed" };
}
