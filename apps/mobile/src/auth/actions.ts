import { api } from '../store/api';
import type { AppDispatch, RootState } from '../store';
import { endSession, restoreSession } from './session';
import { sessionDeps } from './sessionDeps';

/**
 * Acciones de sesión listas para usar desde las pantallas, con las
 * dependencias reales (Supabase Auth y expo-secure-store).
 */

/** Se llama una vez al abrir la app. */
export function restoreSessionOnLaunch() {
  return (dispatch: AppDispatch) => restoreSession(sessionDeps, dispatch);
}

/** Cierra sesión y borra la caché de la API para no dejar datos personales. */
export function signOut() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    await endSession(sessionDeps, dispatch, getState().auth.accessToken);
    dispatch(api.util.resetApiState());
  };
}
