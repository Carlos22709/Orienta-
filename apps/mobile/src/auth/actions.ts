import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../store/api';
import type { AppDispatch, RootState } from '../store';
import { type BrowserDeps, signInWithGoogle } from './googleSignIn';
import { endSession, forgetSession, restoreSession } from './session';
import { sessionDeps } from './sessionDeps';

/**
 * Acciones de sesión listas para usar desde las pantallas, con las
 * dependencias reales (Supabase Auth, expo-secure-store y el navegador del
 * sistema).
 */

/**
 * Navegador del sistema (decisión 0002: nunca un WebView). En Expo Go la URL
 * de regreso es exp://<ip>:<puerto>/--/auth/callback; debe estar permitida en
 * Supabase (Authentication > URL Configuration, con exp://**).
 */
const systemBrowser: BrowserDeps = {
  createRedirectUrl: (state) =>
    Linking.createURL('auth/callback', { queryParams: { state } }),
  openAuthSession: (url, redirectUrl) =>
    WebBrowser.openAuthSessionAsync(url, redirectUrl),
};

/** Se llama una vez al abrir la app. */
export function restoreSessionOnLaunch() {
  return (dispatch: AppDispatch) => restoreSession(sessionDeps, dispatch);
}

/** Abre Google en el navegador del sistema y deja la sesión lista. */
export function signInWithGoogleAction() {
  return (dispatch: AppDispatch) =>
    signInWithGoogle(sessionDeps, systemBrowser, dispatch);
}

/** Tras eliminar la cuenta (DELETE /me): limpia el dispositivo y la caché. */
export function finishAccountDeletion() {
  return async (dispatch: AppDispatch) => {
    await forgetSession(sessionDeps, dispatch, 'deleted');
    dispatch(api.util.resetApiState());
  };
}

/** Cierra sesión y borra la caché de la API para no dejar datos personales. */
export function signOut() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    await endSession(sessionDeps, dispatch, getState().auth.accessToken);
    dispatch(api.util.resetApiState());
  };
}
