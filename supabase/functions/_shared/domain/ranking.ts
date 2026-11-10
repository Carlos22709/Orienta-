import { PRIORITY_ROUTES, SCORE } from "./constants.ts";
import type { Reason } from "./reasons.ts";
import type { OpportunityForRanking, Profile } from "./types.ts";
import type { Validity } from "./validity.ts";

/**
 * Puntaje transparente de una oportunidad elegible (decisión 0005, sección 3).
 * Devuelve también las razones, en el mismo orden en que se suman los puntos.
 */
export function scoreOpportunity(
  profile: Profile,
  opportunity: OpportunityForRanking,
  validity: Validity,
): { score: number; reasons: Reason[] } {
  let score = 0;
  const reasons: Reason[] = [];

  if (profile.interests.includes(opportunity.category)) {
    score += SCORE.interest;
    reasons.push({ type: "interest", category: opportunity.category });
  }

  if (
    PRIORITY_ROUTES[profile.currentSituation].includes(opportunity.category)
  ) {
    score += SCORE.priorityRoute;
    reasons.push({
      type: "priority_route",
      situation: profile.currentSituation,
    });
  }

  // Local: restringida a municipios e incluye el del perfil (no nacional).
  if (opportunity.municipalityCodes?.includes(profile.municipalityCode)) {
    score += SCORE.local;
    reasons.push({ type: "local" });
  }

  if (validity.kind === "closing_soon") {
    score += SCORE.closingSoon;
    reasons.push({ type: "closing_soon", daysLeft: validity.daysLeft });
  }

  // Si ninguna regla de ranking aplica, la razón es la propia elegibilidad.
  if (reasons.length === 0) reasons.push({ type: "meets_requirements" });

  return { score, reasons };
}
