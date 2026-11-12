import type { ApiError } from './apiError';

/**
 * Reglas del step-up en la app (decisión 0002, secciones 5 y 6). Son funciones
 * puras para poder probarlas sin pantallas; useCriticalAction las aplica.
 *
 * Flujo:
 * 1. La acción crítica (exportar o eliminar) responde 403 mfa_required con
 *    un stepUpToken → se pide el código de la app autenticadora.
 * 2. POST /mfa/verify con stepUpToken + código → elevated_token.
 * 3. Se repite la acción con X-Elevated-Token.
 */

export type ActionStep =
  | { kind: 'ask_code'; stepUpToken: string }
  | { kind: 'needs_enrollment'; message: string }
  | { kind: 'failed'; message: string };

/** Qué hacer cuando la acción crítica falla. */
export function stepAfterActionError(error: ApiError): ActionStep {
  if (error.status === 403 && error.code === 'mfa_required' && error.stepUpToken) {
    return { kind: 'ask_code', stepUpToken: error.stepUpToken };
  }
  if (error.status === 403 && error.code === 'mfa_enrollment_required') {
    return { kind: 'needs_enrollment', message: error.message };
  }
  return { kind: 'failed', message: error.message };
}

export type VerifyStep =
  /** El código no sirve: se muestra junto al campo y se puede reintentar. */
  | { kind: 'retry_code'; message: string }
  /**
   * El reto venció o ya se usó: se repite la acción para obtener uno nuevo
   * sin perder lo que la persona quería hacer (sin límites de tiempo
   * estrictos, compromiso de la Fase 2).
   */
  | { kind: 'restart_action'; message: string }
  | { kind: 'failed'; message: string };

export const STEP_UP_RESTARTED_MESSAGE =
  'La verificación venció. Escribe el código que muestra ahora tu app autenticadora.';

/** Qué hacer cuando POST /mfa/verify falla. */
export function stepAfterVerifyError(error: ApiError): VerifyStep {
  switch (error.code) {
    case 'invalid_code':
    case 'replay_detected':
    case 'validation_error':
      return { kind: 'retry_code', message: error.message };
    case 'step_up_expired':
      return { kind: 'restart_action', message: STEP_UP_RESTARTED_MESSAGE };
    default:
      return { kind: 'failed', message: error.message };
  }
}

/** Agrupa la clave Base32 de 4 en 4 para leerla y copiarla a mano. */
export function formatSecretForReading(secret: string): string {
  return secret.replace(/(.{4})(?=.)/g, '$1 ');
}
