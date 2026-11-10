import type { Profile } from "../_shared/domain/types.ts";
import type { StoredProfile } from "./deps.ts";

/** Campos del perfil en el orden de los pasos del formulario. */
export const PROFILE_FIELDS = [
  "birthDate",
  "municipalityCode",
  "educationLevel",
  "experienceLevel",
  "currentSituation",
  "interests",
  "availability",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];

/** Campos que faltan; la app los usa para retomar el perfil (Fase 2, C3). */
export function findMissingFields(
  profile: StoredProfile | null,
): ProfileField[] {
  if (!profile) return [...PROFILE_FIELDS];
  return PROFILE_FIELDS.filter((field) =>
    field === "interests"
      ? profile.interests.length === 0
      : profile[field] === null
  );
}

/** Perfil listo para recomendar, o null si todavía le faltan campos. */
export function toCompleteProfile(
  profile: StoredProfile | null,
): Profile | null {
  if (!profile || findMissingFields(profile).length > 0) return null;
  return {
    birthDate: profile.birthDate!,
    municipalityCode: profile.municipalityCode!,
    educationLevel: profile.educationLevel!,
    experienceLevel: profile.experienceLevel!,
    currentSituation: profile.currentSituation!,
    interests: profile.interests,
    availability: profile.availability!,
  };
}
