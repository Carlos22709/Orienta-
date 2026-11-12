import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { ProfileFormState } from './profileForm';

/**
 * Borrador del cuestionario guardado en el teléfono (compromiso C3, WCAG
 * 3.3.7): si la persona cierra la app a mitad de camino, al volver retoma
 * donde iba. Se borra al guardar el perfil en el servidor o al cerrar sesión.
 */
const KEY = 'orienta.questionnaire.draft.v1';

const draftSchema = z.object({
  form: z.object({
    birthDate: z.string(),
    municipalityCode: z.string().nullable(),
    educationLevel: z.string().nullable(),
    experienceLevel: z.string().nullable(),
    currentSituation: z.string().nullable(),
    interests: z.array(z.string()),
    availability: z.string().nullable(),
  }),
  stepIndex: z.number().int().min(0),
  consentAccepted: z.boolean(),
});

export type QuestionnaireDraft = z.infer<typeof draftSchema>;

/** Lee un borrador guardado; null si no hay o si no tiene el formato esperado. */
export function parseDraft(raw: string | null): QuestionnaireDraft | null {
  if (!raw) return null;
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** true si el borrador tiene al menos una respuesta (vale la pena retomarlo). */
export function hasAnswers(form: ProfileFormState): boolean {
  return (
    form.birthDate !== '' ||
    form.municipalityCode !== null ||
    form.educationLevel !== null ||
    form.experienceLevel !== null ||
    form.currentSituation !== null ||
    form.interests.length > 0 ||
    form.availability !== null
  );
}

export async function loadDraft(): Promise<QuestionnaireDraft | null> {
  try {
    return parseDraft(await AsyncStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveDraft(draft: QuestionnaireDraft): void {
  AsyncStorage.setItem(KEY, JSON.stringify(draft)).catch(() => {
    // Sin almacenamiento, el cuestionario funciona igual; solo no se retoma.
  });
}

export function clearDraft(): void {
  AsyncStorage.removeItem(KEY).catch(() => {});
}
