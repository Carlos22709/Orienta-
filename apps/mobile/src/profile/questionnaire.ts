import type { ProfileFormState } from './profileForm';

/**
 * Lógica del cuestionario paso a paso (rediseño Amanecer). Reutiliza el
 * estado y el envío del formulario de perfil de Laura (profileForm.ts).
 */

export const STEPS = [
  'birthDate',
  'municipalityCode',
  'educationLevel',
  'experienceLevel',
  'currentSituation',
  'interests',
  'availability',
  'consent',
] as const;

export type Step = (typeof STEPS)[number];

/** true si la persona ya respondió el paso. */
export function isStepComplete(
  step: Step,
  form: ProfileFormState,
  consentAccepted: boolean,
): boolean {
  switch (step) {
    case 'birthDate':
      return form.birthDate !== '';
    case 'interests':
      return form.interests.length > 0;
    case 'consent':
      return consentAccepted;
    default:
      return form[step] !== null;
  }
}

/** Primer paso sin responder, para retomar donde la persona iba. */
export function firstIncompleteStep(form: ProfileFormState, consentAccepted: boolean): number {
  const index = STEPS.findIndex((step) => !isStepComplete(step, form, consentAccepted));
  return index === -1 ? STEPS.length - 1 : index;
}

/** Fecha local en formato AAAA-MM-DD (sin pasar por UTC). */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Convierte AAAA-MM-DD en una fecha local a mediodía (evita saltos de día). */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/**
 * Límites de la rueda de fecha: entre 18 y 29 años cumplidos hoy, el rango
 * del público de Orienta+ (decisión 0004). Así nadie elige una fecha que el
 * servidor vaya a rechazar.
 */
export function birthDateBounds(today: Date): { minimum: Date; maximum: Date; initial: Date } {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  return {
    // Cumple 18 hoy como máximo.
    maximum: new Date(year - 18, month, day, 12),
    // Tiene 29 años como máximo: nació después de hace 30 años.
    minimum: new Date(year - 30, month, day + 1, 12),
    initial: new Date(year - 20, month, day, 12),
  };
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "14 de marzo de 2007". */
export function formatBirthDate(value: string): string {
  const date = fromIsoDate(value);
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

/** Edad cumplida en `today` para una fecha AAAA-MM-DD. */
export function ageOn(value: string, today: Date): number {
  const birth = fromIsoDate(value);
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
