import { z } from 'zod';

/**
 * Lógica del formulario de perfil, separada de la pantalla para poder
 * probarla sin renderizar (app/profile/index.tsx la usa).
 *
 * Contrato del servidor: PUT /api/me/profile en
 * supabase/functions/api/schemas/profile.ts. Los campos son opcionales para
 * poder guardar el perfil por pasos y retomarlo después (Fase 2, C3).
 */

/** Campos del perfil en el orden del formulario (igual que el backend). */
export const PROFILE_FIELDS = [
  'birthDate',
  'municipalityCode',
  'educationLevel',
  'experienceLevel',
  'currentSituation',
  'interests',
  'availability',
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];

/** Nombre corto de cada campo, para resúmenes de error y de faltantes. */
export const FIELD_NAMES: Record<ProfileField, string> = {
  birthDate: 'Fecha de nacimiento',
  municipalityCode: 'Municipio',
  educationLevel: 'Nivel educativo',
  experienceLevel: 'Experiencia laboral',
  currentSituation: 'Situación actual',
  interests: 'Intereses',
  availability: 'Disponibilidad',
};

/** Estado editable del formulario. null o vacío = la persona no ha respondido. */
export interface ProfileFormState {
  birthDate: string;
  municipalityCode: string | null;
  educationLevel: string | null;
  experienceLevel: string | null;
  currentSituation: string | null;
  interests: string[];
  availability: string | null;
}

export const EMPTY_FORM: ProfileFormState = {
  birthDate: '',
  municipalityCode: null,
  educationLevel: null,
  experienceLevel: null,
  currentSituation: null,
  interests: [],
  availability: null,
};

/** Perfil tal como lo devuelve GET o PUT /api/me/profile. */
export interface StoredProfile {
  birthDate: string | null;
  municipalityCode: string | null;
  educationLevel: string | null;
  experienceLevel: string | null;
  currentSituation: string | null;
  interests: string[];
  availability: string | null;
  consentVersion: string;
  consentedAt: string;
}

/** Cuerpo de PUT /api/me/profile. */
export interface ProfileUpdate {
  birthDate?: string;
  municipalityCode?: string;
  educationLevel?: string;
  experienceLevel?: string;
  currentSituation?: string;
  interests?: string[];
  availability?: string;
  consent?: { version: string; accepted: true };
}

/** Llena el formulario con el perfil guardado, para retomarlo. */
export function formFromProfile(profile: StoredProfile | null): ProfileFormState {
  if (!profile) return EMPTY_FORM;
  return {
    birthDate: profile.birthDate ?? '',
    municipalityCode: profile.municipalityCode,
    educationLevel: profile.educationLevel,
    experienceLevel: profile.experienceLevel,
    currentSituation: profile.currentSituation,
    interests: profile.interests,
    availability: profile.availability,
  };
}

/**
 * true si el texto es una fecha AAAA-MM-DD que existe en el calendario.
 * Rechaza, por ejemplo, 2004-02-30. La regla de edad (18 a 29 años) la
 * aplica el servidor, que conoce la fecha actual en Colombia.
 */
export function isValidBirthDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validación local antes de enviar: solo revisa lo que la persona escribió.
 * Los campos vacíos no son error porque el perfil se puede guardar por pasos.
 */
export function validateProfileForm(
  form: ProfileFormState,
): Partial<Record<ProfileField, string>> {
  const errors: Partial<Record<ProfileField, string>> = {};
  const birthDate = form.birthDate.trim();
  if (birthDate !== '' && !isValidBirthDate(birthDate)) {
    errors.birthDate =
      'Escribe tu fecha de nacimiento con el formato AAAA-MM-DD, por ejemplo 2004-05-15.';
  }
  return errors;
}

/**
 * Construye el cuerpo del PUT con los campos respondidos. Si la persona
 * aceptó el consentimiento en la bienvenida, se envía con la versión vigente
 * que publica GET /api/catalog.
 */
export function toProfileUpdate(
  form: ProfileFormState,
  consentVersion: string | null,
): ProfileUpdate {
  const update: ProfileUpdate = {};
  const birthDate = form.birthDate.trim();
  if (birthDate !== '') update.birthDate = birthDate;
  if (form.municipalityCode) update.municipalityCode = form.municipalityCode;
  if (form.educationLevel) update.educationLevel = form.educationLevel;
  if (form.experienceLevel) update.experienceLevel = form.experienceLevel;
  if (form.currentSituation) update.currentSituation = form.currentSituation;
  if (form.interests.length > 0) update.interests = form.interests;
  if (form.availability) update.availability = form.availability;
  if (consentVersion) update.consent = { version: consentVersion, accepted: true };
  return update;
}

/** Agrega o quita un interés (selección múltiple). */
export function toggleInterest(interests: string[], value: string): string[] {
  return interests.includes(value)
    ? interests.filter((item) => item !== value)
    : [...interests, value];
}

/** Texto en lenguaje claro con los nombres de los campos indicados. */
export function describeFields(fields: readonly string[]): string {
  return fields
    .map((field) => FIELD_NAMES[field as ProfileField] ?? field)
    .join(', ');
}

/** Cuerpo de error de la API (supabase/functions/api/http/errors.ts). */
const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});

export type SaveProfileError =
  | { kind: 'validation'; message: string; fields: Record<string, string> }
  | { kind: 'consent_required'; message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'network'; message: string };

const NETWORK_MESSAGE =
  'No pudimos guardar tu perfil. Revisa tu conexión e intenta de nuevo.';

/**
 * Traduce el error de RTK Query a un caso que la pantalla sabe mostrar.
 * RTK Query entrega { status: número, data } si el servidor respondió, o
 * { status: 'FETCH_ERROR' | 'TIMEOUT_ERROR' | ... } si no hubo respuesta.
 */
export function readSaveProfileError(error: unknown): SaveProfileError {
  const status = (error as { status?: unknown } | null)?.status;
  const body = apiErrorSchema.safeParse(
    (error as { data?: unknown } | null)?.data,
  );

  if (status === 401) {
    return {
      kind: 'unauthorized',
      message: 'Tu sesión no es válida. Inicia sesión de nuevo para guardar tu perfil.',
    };
  }
  if (!body.success) {
    return { kind: 'network', message: NETWORK_MESSAGE };
  }
  if (status === 422 && body.data.error === 'validation_error') {
    return {
      kind: 'validation',
      message: body.data.message,
      fields: body.data.fields ?? {},
    };
  }
  if (status === 409 && body.data.error === 'consent_required') {
    return { kind: 'consent_required', message: body.data.message };
  }
  return { kind: 'network', message: body.data.message || NETWORK_MESSAGE };
}
