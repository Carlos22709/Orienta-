import type {
  Availability,
  Category,
  EducationLevel,
  ExperienceLevel,
  Situation,
} from "../domain/types.ts";

/**
 * Etiquetas en lenguaje claro de los valores del perfil (Fase 2, compromiso
 * C1). El orden de cada objeto es el orden en que se muestran las opciones.
 */

export const CATEGORY_LABELS: Record<Category, string> = {
  employment: "Empleo",
  training: "Formación y cursos",
  scholarship: "Becas",
  subsidy: "Subsidios y apoyos económicos",
  entrepreneurship: "Emprendimiento",
};

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  secondary_incomplete: "Bachillerato sin terminar",
  secondary: "Bachiller",
  technical: "Técnico",
  technologist: "Tecnólogo",
  university_incomplete: "Universidad sin terminar",
  university: "Profesional universitario",
  postgraduate: "Posgrado",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  none: "Sin experiencia laboral",
  lt_1y: "Menos de 1 año",
  "1_3y": "De 1 a 3 años",
  gt_3y: "Más de 3 años",
};

export const SITUATION_LABELS: Record<Situation, string> = {
  studying: "Estudio",
  working: "Trabajo",
  both: "Estudio y trabajo",
  neither: "No estudio ni trabajo",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  full_time: "Tiempo completo",
  part_time: "Medio tiempo",
  weekends: "Fines de semana",
  flexible: "Horario flexible",
};

/** Convierte un mapa de etiquetas en la lista { value, label } del catálogo. */
export function toOptions<T extends string>(
  labels: Record<T, string>,
): Array<{ value: T; label: string }> {
  return (Object.entries(labels) as Array<[T, string]>).map((
    [value, label],
  ) => ({ value, label }));
}
