import type { OpportunityForRanking, Profile } from "../types.ts";

/**
 * Datos de prueba. Son ficticios: no representan personas ni convocatorias
 * reales y solo se usan en pruebas (AGENTS.md). Los códigos de municipio son
 * marcadores, no códigos DIVIPOLA reales.
 */

/** 9 de noviembre de 2026, 10:00 a. m. en Bogotá. */
export const NOW = new Date("2026-11-09T15:00:00Z");
export const TODAY = "2026-11-09";

export const BOGOTA = "test-bogota";
export const CHIA = "test-chia";
export const ZIPAQUIRA = "test-zipaquira";
export const CAJICA = "test-cajica";

/** Perfiles de prueba P1–P5 de la decisión 0007 (edades al 2026-11-09). */
export const TEST_PROFILES = {
  /** 19 años, Chía, no estudia ni trabaja. */
  P1: {
    birthDate: "2007-03-15",
    municipalityCode: CHIA,
    educationLevel: "secondary",
    experienceLevel: "none",
    currentSituation: "neither",
    interests: ["training", "subsidy"],
    availability: "flexible",
  },
  /** 22 años, Bogotá, estudia. */
  P2: {
    birthDate: "2004-06-20",
    municipalityCode: BOGOTA,
    educationLevel: "university_incomplete",
    experienceLevel: "lt_1y",
    currentSituation: "studying",
    interests: ["scholarship", "employment"],
    availability: "part_time",
  },
  /** 26 años, Zipaquirá, trabaja. */
  P3: {
    birthDate: "2000-01-10",
    municipalityCode: ZIPAQUIRA,
    educationLevel: "technical",
    experienceLevel: "1_3y",
    currentSituation: "working",
    interests: ["entrepreneurship", "training"],
    availability: "weekends",
  },
  /** 28 años, Bogotá, estudia y trabaja. */
  P4: {
    birthDate: "1998-08-05",
    municipalityCode: BOGOTA,
    educationLevel: "university",
    experienceLevel: "gt_3y",
    currentSituation: "both",
    interests: ["employment", "scholarship"],
    availability: "full_time",
  },
  /** 24 años, Cajicá, trabaja. */
  P5: {
    birthDate: "2002-02-28",
    municipalityCode: CAJICA,
    educationLevel: "technologist",
    experienceLevel: "lt_1y",
    currentSituation: "working",
    interests: ["employment", "entrepreneurship"],
    availability: "part_time",
  },
} as const satisfies Record<string, Profile>;

let sequence = 0;

/**
 * Crea una oportunidad vigente, nacional y sin restricciones de elegibilidad;
 * cada prueba sobrescribe solo los campos que le interesan.
 */
export function makeOpportunity(
  overrides: Partial<OpportunityForRanking> = {},
): OpportunityForRanking {
  sequence += 1;
  return {
    id: `opp-${String(sequence).padStart(3, "0")}`,
    category: "training",
    status: "active",
    deadline: "2026-12-31",
    verifiedAt: "2026-11-01T12:00:00Z",
    minAge: null,
    maxAge: null,
    minEducation: null,
    minExperience: null,
    availability: null,
    municipalityCodes: null,
    ...overrides,
  };
}
