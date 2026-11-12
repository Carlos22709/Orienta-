import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';

/**
 * Retroalimentación multisensorial (compromiso A2, WCAG 1.3.3 y 4.1.3).
 *
 * Cada aviso importante llega por tres canales que no dependen entre sí:
 * - visual: el texto en pantalla (lo pone cada pantalla);
 * - auditivo: el anuncio del lector de pantalla;
 * - táctil: una vibración breve, útil con el teléfono en silencio.
 *
 * La vibración es un refuerzo: si el dispositivo no la soporta, se ignora.
 */
function vibrate(run: () => Promise<void>) {
  run().catch(() => {
    // Sin motor háptico (por ejemplo, en un emulador): no pasa nada.
  });
}

/** Acción completada: guardar, activar, descargar. */
export function notifySuccess(message?: string) {
  vibrate(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  if (message) AccessibilityInfo.announceForAccessibility(message);
}

/** Algo falló o falta corregir. */
export function notifyError(message?: string) {
  vibrate(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  if (message) AccessibilityInfo.announceForAccessibility(message);
}

/** Atención antes de una acción delicada (por ejemplo, eliminar la cuenta). */
export function notifyWarning(message?: string) {
  vibrate(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  if (message) AccessibilityInfo.announceForAccessibility(message);
}

/** Cambio de selección: marcar una opción o un ♡. */
export function notifySelection() {
  vibrate(() => Haptics.selectionAsync());
}
