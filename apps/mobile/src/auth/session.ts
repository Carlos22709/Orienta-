import type { Dispatch } from '@reduxjs/toolkit';
import { sessionEnded, sessionStarted, type SignedOutReason } from '../store/authSlice';
import type { AuthClient, Session } from './authClient';
import type { TokenStorage } from './tokenStorage';

/**
 * Operaciones de sesión (decisión 0002). Reciben sus dependencias para poder
 * probarse con dobles en memoria.
 */
export interface SessionDeps {
  /** null si faltan las variables de Supabase en el .env. */
  authClient: AuthClient | null;
  storage: TokenStorage;
}

/**
 * - refreshed: hay un access_token nuevo en el store.
 * - no_session: no había refresh_token guardado.
 * - expired: Supabase rechazó el refresh_token; se borró del dispositivo.
 * - unavailable: no se pudo contactar a Supabase; el refresh_token se conserva.
 */
export type RefreshOutcome = 'refreshed' | 'no_session' | 'expired' | 'unavailable';

/** Guarda la sesión: refresh_token al almacenamiento seguro, el resto a Redux. */
async function applySession(
  deps: SessionDeps,
  dispatch: Dispatch,
  session: Session,
): Promise<void> {
  try {
    await deps.storage.setRefreshToken(session.refreshToken);
  } catch {
    // Si el almacenamiento falla, la sesión sigue en memoria mientras la app
    // esté abierta; al volver a abrirla se pedirá iniciar sesión.
  }
  dispatch(
    sessionStarted({
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      user: session.user,
    }),
  );
}

/** Renueva la sesión con el refresh_token guardado (rotación de Supabase). */
export async function refreshStoredSession(
  deps: SessionDeps,
  dispatch: Dispatch,
): Promise<RefreshOutcome> {
  if (!deps.authClient) {
    return 'unavailable';
  }

  const refreshToken = await deps.storage.getRefreshToken();
  if (!refreshToken) {
    dispatch(sessionEnded(null));
    return 'no_session';
  }

  const result = await deps.authClient.refreshSession(refreshToken);
  if (result.ok) {
    await applySession(deps, dispatch, result.session);
    return 'refreshed';
  }
  if (result.reason === 'invalid') {
    await deps.storage.clear();
    dispatch(sessionEnded('expired'));
    return 'expired';
  }
  return 'unavailable';
}

/** Al abrir la app: intenta recuperar la sesión anterior. */
export async function restoreSession(
  deps: SessionDeps,
  dispatch: Dispatch,
): Promise<RefreshOutcome> {
  const outcome = await refreshStoredSession(deps, dispatch);
  if (outcome === 'unavailable') {
    dispatch(sessionEnded('unavailable'));
  }
  return outcome;
}

/** Tras el intercambio PKCE: deja la sesión lista. */
export function startSession(
  deps: SessionDeps,
  dispatch: Dispatch,
  session: Session,
): Promise<void> {
  return applySession(deps, dispatch, session);
}

/** Cierra la sesión en Supabase (mejor esfuerzo) y borra todo del dispositivo. */
export async function endSession(
  deps: SessionDeps,
  dispatch: Dispatch,
  accessToken: string | null,
): Promise<void> {
  if (deps.authClient && accessToken) {
    await deps.authClient.signOut(accessToken);
  }
  await forgetSession(deps, dispatch, 'signedOut');
}

/**
 * Borra la sesión solo del dispositivo, sin llamar a Supabase. Se usa después
 * de eliminar la cuenta: la persona ya no existe y no hay sesión que revocar.
 */
export async function forgetSession(
  deps: SessionDeps,
  dispatch: Dispatch,
  reason: SignedOutReason,
): Promise<void> {
  await deps.storage.clear();
  dispatch(sessionEnded(reason));
}
