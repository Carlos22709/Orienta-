/**
 * Tipos del dominio de recomendación (decisiones 0004 y 0005).
 *
 * Los enumerados ordenados (educación y experiencia) se declaran de menor a
 * mayor: la posición en el arreglo es la que se compara en la elegibilidad.
 */

export const CATEGORIES = [
  "employment",
  "training",
  "scholarship",
  "subsidy",
  "entrepreneurship",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Ordenado de menor a mayor nivel. */
export const EDUCATION_LEVELS = [
  "secondary_incomplete",
  "secondary",
  "technical",
  "technologist",
  "university_incomplete",
  "university",
  "postgraduate",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

/** Ordenado de menor a mayor experiencia. */
export const EXPERIENCE_LEVELS = ["none", "lt_1y", "1_3y", "gt_3y"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const SITUATIONS = ["studying", "working", "both", "neither"] as const;
export type Situation = (typeof SITUATIONS)[number];

export const AVAILABILITIES = [
  "full_time",
  "part_time",
  "weekends",
  "flexible",
] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const OPPORTUNITY_STATUSES = ["active", "closed", "withdrawn"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

/** Perfil del usuario con los datos que usa la recomendación. */
export interface Profile {
  /** Fecha de nacimiento en formato YYYY-MM-DD. */
  birthDate: string;
  /** Código DIVIPOLA del municipio. */
  municipalityCode: string;
  educationLevel: EducationLevel;
  experienceLevel: ExperienceLevel;
  currentSituation: Situation;
  interests: readonly Category[];
  availability: Availability;
}

/**
 * Campos de una oportunidad que intervienen en vigencia, elegibilidad y
 * ranking. Las filas de la base de datos tienen más campos; el dominio solo
 * necesita estos. Un valor null significa "sin restricción".
 */
export interface OpportunityForRanking {
  id: string;
  category: Category;
  status: OpportunityStatus;
  /** Fecha límite YYYY-MM-DD, o null si es una convocatoria abierta. */
  deadline: string | null;
  /** Instante de la última verificación humana (ISO 8601). */
  verifiedAt: string;
  minAge: number | null;
  maxAge: number | null;
  minEducation: EducationLevel | null;
  minExperience: ExperienceLevel | null;
  availability: readonly Availability[] | null;
  /** Municipios DIVIPOLA donde aplica; null si es nacional o virtual. */
  municipalityCodes: readonly string[] | null;
}
