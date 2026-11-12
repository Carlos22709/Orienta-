import type { SignedOutReason } from '../store/authSlice';
import type { SignInOutcome } from './googleSignIn';

/** Mensajes en lenguaje claro para cada resultado del inicio de sesión. */
export const SIGN_IN_MESSAGES: Record<Exclude<SignInOutcome, 'signed_in'>, string> = {
  cancelled: 'Cerraste el inicio de sesión. Puedes intentarlo de nuevo cuando quieras.',
  state_mismatch:
    'No pudimos confirmar que la respuesta era de tu inicio de sesión. Intenta de nuevo.',
  provider_error: 'Google no completó el inicio de sesión. Intenta de nuevo.',
  invalid: 'El inicio de sesión venció antes de terminar. Intenta de nuevo.',
  unavailable: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  not_configured:
    'Falta configurar el inicio de sesión en esta copia de la app (variables de Supabase).',
};

/** Por qué no hay sesión al llegar a la bienvenida. */
export const SIGNED_OUT_MESSAGES: Record<SignedOutReason, string> = {
  expired: 'Tu sesión terminó. Vuelve a iniciar sesión para continuar.',
  unavailable:
    'No pudimos recuperar tu sesión porque no hubo conexión. Intenta iniciar sesión de nuevo.',
  signedOut: 'Cerraste sesión. ¡Vuelve pronto!',
  deleted: 'Eliminamos tu cuenta y todos tus datos de Orienta+.',
};
