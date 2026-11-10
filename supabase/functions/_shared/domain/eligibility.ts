import { ageOn } from "./dates.ts";
import {
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  type OpportunityForRanking,
  type Profile,
} from "./types.ts";

/** Criterios obligatorios de elegibilidad (decisión 0005, sección 2). */
export type EligibilityCriterion =
  | "age"
  | "location"
  | "education"
  | "experience"
  | "availability";

/** Posición de un nivel dentro de su enumerado ordenado de menor a mayor. */
function levelOf(levels: readonly string[], value: string): number {
  return levels.indexOf(value);
}

/**
 * Devuelve los criterios que el perfil NO cumple, en orden fijo.
 * Una lista vacía significa que la oportunidad es elegible.
 * Un campo null en la oportunidad significa "sin restricción".
 */
export function findUnmetCriteria(
  profile: Profile,
  opportunity: OpportunityForRanking,
  today: string,
): EligibilityCriterion[] {
  const unmet: EligibilityCriterion[] = [];

  const age = ageOn(profile.birthDate, today);
  if (
    (opportunity.minAge !== null && age < opportunity.minAge) ||
    (opportunity.maxAge !== null && age > opportunity.maxAge)
  ) {
    unmet.push("age");
  }

  if (
    opportunity.municipalityCodes !== null &&
    !opportunity.municipalityCodes.includes(profile.municipalityCode)
  ) {
    unmet.push("location");
  }

  if (
    opportunity.minEducation !== null &&
    levelOf(EDUCATION_LEVELS, profile.educationLevel) <
      levelOf(EDUCATION_LEVELS, opportunity.minEducation)
  ) {
    unmet.push("education");
  }

  if (
    opportunity.minExperience !== null &&
    levelOf(EXPERIENCE_LEVELS, profile.experienceLevel) <
      levelOf(EXPERIENCE_LEVELS, opportunity.minExperience)
  ) {
    unmet.push("experience");
  }

  if (
    opportunity.availability !== null &&
    profile.availability !== "flexible" &&
    !opportunity.availability.includes(profile.availability)
  ) {
    unmet.push("availability");
  }

  return unmet;
}

export function isEligible(
  profile: Profile,
  opportunity: OpportunityForRanking,
  today: string,
): boolean {
  return findUnmetCriteria(profile, opportunity, today).length === 0;
}
