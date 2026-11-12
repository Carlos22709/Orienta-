import type { Dispatch } from '@reduxjs/toolkit';
import { parseCallbackUrl } from './callbackUrl';
import { createCodeChallenge, createCodeVerifier, createState } from './pkce';
import { type SessionDeps, startSession } from './session';

/**
 * Inicio de sesión con Google: Authorization Code + PKCE contra Supabase Auth
 * (decisión 0002, sección 1).
 *
 * 1. Se crean code_verifier, code_challenge (S256) y state, solo en memoria.
 * 2. Se abre el navegador del sistema en /auth/v1/authorize con el
 *    code_challenge. Nunca un WebView.
 * 3. Supabase vuelve a la app con ?code=... en la URL de redirección, que
 *    lleva el state propio.
 * 4. Si el state no coincide, se aborta: la respuesta no es de este intento.
 * 5. Se canjea el código junto con el code_verifier por la sesión.
 */

/** Resultado del navegador, con la misma forma que expo-web-browser. */
export type AuthSessionResult =
  | { type: 'success'; url: string }
  | { type: 'cancel' | 'dismiss' | 'locked' | 'opened' };

export interface BrowserDeps {
  /** URL de regreso a la app que incluye el state. */
  createRedirectUrl(state: string): string;
  openAuthSession(url: string, redirectUrl: string): Promise<AuthSessionResult>;
}

export interface PkceDeps {
  createCodeVerifier: () => string;
  createCodeChallenge: (verifier: string) => Promise<string>;
  createState: () => string;
}

const defaultPkce: PkceDeps = {
  createCodeVerifier: () => createCodeVerifier(),
  createCodeChallenge: (verifier) => createCodeChallenge(verifier),
  createState: () => createState(),
};

/**
 * - signed_in: la sesión quedó lista.
 * - cancelled: la persona cerró el navegador.
 * - state_mismatch: el state no coincide; se descartó la respuesta.
 * - provider_error: Google o Supabase devolvieron un error o no hubo código.
 * - invalid: Supabase rechazó el código (por ejemplo, venció).
 * - unavailable: no hubo conexión con Supabase.
 * - not_configured: faltan las variables de Supabase en el .env.
 */
export type SignInOutcome =
  | 'signed_in'
  | 'cancelled'
  | 'state_mismatch'
  | 'provider_error'
  | 'invalid'
  | 'unavailable'
  | 'not_configured';

export async function signInWithGoogle(
  deps: SessionDeps,
  browser: BrowserDeps,
  dispatch: Dispatch,
  pkce: PkceDeps = defaultPkce,
): Promise<SignInOutcome> {
  const { authClient } = deps;
  if (!authClient) {
    return 'not_configured';
  }

  const codeVerifier = pkce.createCodeVerifier();
  const codeChallenge = await pkce.createCodeChallenge(codeVerifier);
  const state = pkce.createState();
  const redirectUrl = browser.createRedirectUrl(state);
  if (__DEV__) {
    // Ayuda a diagnosticar la redirección en desarrollo: Supabase rechaza las
    // URL con IP (ver decisión 0002), así que aquí debe verse un nombre de host.
    console.log(`[auth] URL de regreso: ${redirectUrl}`);
  }

  const result = await browser.openAuthSession(
    authClient.buildAuthorizeUrl({
      provider: 'google',
      redirectTo: redirectUrl,
      codeChallenge,
    }),
    redirectUrl,
  );
  if (result.type !== 'success') {
    return 'cancelled';
  }

  const callback = parseCallbackUrl(result.url);
  if (callback.state !== state) {
    return 'state_mismatch';
  }
  if (callback.error || !callback.code) {
    return 'provider_error';
  }

  const exchange = await authClient.exchangeCodeForSession(
    callback.code,
    codeVerifier,
  );
  if (!exchange.ok) {
    return exchange.reason;
  }

  await startSession(deps, dispatch, exchange.session);
  return 'signed_in';
}
