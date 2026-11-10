import { z } from "zod";
import {
  AVAILABILITIES,
  CATEGORIES,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  SITUATIONS,
} from "../../_shared/domain/types.ts";

/**
 * Cuerpo de PUT /api/me/profile. Todos los campos son opcionales porque el
 * perfil se guarda paso a paso; .strict() rechaza campos desconocidos.
 */
export const profileUpdateSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  municipalityCode: z.string().regex(/^\d{5}$/).optional(),
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  currentSituation: z.enum(SITUATIONS).optional(),
  interests: z.array(z.enum(CATEGORIES)).min(1).optional(),
  availability: z.enum(AVAILABILITIES).optional(),
  consent: z.object({ version: z.string(), accepted: z.literal(true) })
    .strict()
    .optional(),
}).strict();

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** Mensajes por campo en lenguaje claro (se muestran junto a cada campo). */
export const FIELD_MESSAGES: Record<string, string> = {
  birthDate: "Escribe tu fecha de nacimiento con el formato AAAA-MM-DD.",
  municipalityCode: "Elige un municipio de la lista.",
  educationLevel: "Elige tu nivel de estudios de la lista.",
  experienceLevel: "Elige tu experiencia laboral de la lista.",
  currentSituation: "Elige tu situación actual de la lista.",
  interests: "Elige al menos un tipo de oportunidad.",
  availability: "Elige tu disponibilidad de la lista.",
  consent: "Debes aceptar la versión vigente del tratamiento de datos.",
};

export const UNKNOWN_FIELD_MESSAGE = "Este campo no se reconoce.";

/** Convierte los errores de Zod en { campo: mensaje }. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) fields[key] = UNKNOWN_FIELD_MESSAGE;
      continue;
    }
    const field = String(issue.path[0] ?? "");
    fields[field] ??= FIELD_MESSAGES[field] ?? UNKNOWN_FIELD_MESSAGE;
  }
  return fields;
}
