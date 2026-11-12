import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../store/authSlice';
import {
  createFakeAuthClient,
  createMemoryTokenStorage,
  makeSession,
} from '../testing/fakes';
import type { SessionResult } from './authClient';
import { type AuthSessionResult, signInWithGoogle } from './googleSignIn';

const PKCE = {
  createCodeVerifier: () => 'verificador',
  createCodeChallenge: () => Promise.resolve('reto'),
  createState: () => 'state-1',
};

const REDIRECT = 'exp://192.168.0.10:8081/--/auth/callback?state=state-1';

function setup(
  browserResult: AuthSessionResult,
  exchangeResult: SessionResult = { ok: true, session: makeSession() },
) {
  const store = configureStore({ reducer: { auth: authSlice.reducer } });
  const storage = createMemoryTokenStorage();
  const authClient = createFakeAuthClient(() => ({ ok: false, reason: 'invalid' }));
  authClient.exchangeCodeForSession.mockResolvedValue(exchangeResult);
  const browser = {
    createRedirectUrl: jest.fn((state: string) =>
      `exp://192.168.0.10:8081/--/auth/callback?state=${state}`,
    ),
    openAuthSession: jest.fn((_url: string, _redirect: string) =>
      Promise.resolve(browserResult),
    ),
  };
  const run = () =>
    signInWithGoogle({ authClient, storage }, browser, store.dispatch, PKCE);
  return { store, storage, authClient, browser, run };
}

describe('signInWithGoogle', () => {
  it('abre el navegador con el code_challenge y canjea el código con el code_verifier', async () => {
    const { run, authClient, browser, storage, store } = setup({
      type: 'success',
      url: `${REDIRECT}&code=codigo-google`,
    });

    await expect(run()).resolves.toBe('signed_in');

    expect(authClient.buildAuthorizeUrl).toHaveBeenCalledWith({
      provider: 'google',
      redirectTo: REDIRECT,
      codeChallenge: 'reto',
    });
    expect(browser.openAuthSession).toHaveBeenCalledWith(
      'https://example.com/authorize',
      REDIRECT,
    );
    expect(authClient.exchangeCodeForSession).toHaveBeenCalledWith(
      'codigo-google',
      'verificador',
    );
    expect(storage.value).toBe('refresh-1');
    expect(store.getState().auth.status).toBe('signedIn');
  });

  it('si el state no coincide, no canjea el código', async () => {
    const { run, authClient, store } = setup({
      type: 'success',
      url: 'exp://h/--/auth/callback?state=otro&code=codigo-ajeno',
    });

    await expect(run()).resolves.toBe('state_mismatch');
    expect(authClient.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(store.getState().auth.status).toBe('restoring');
  });

  it.each<AuthSessionResult['type']>(['cancel', 'dismiss'])(
    'si la persona cierra el navegador (%s), no pasa nada más',
    async (type) => {
      const { run, authClient } = setup({ type } as AuthSessionResult);

      await expect(run()).resolves.toBe('cancelled');
      expect(authClient.exchangeCodeForSession).not.toHaveBeenCalled();
    },
  );

  it('un error de Google en la redirección no intenta el canje', async () => {
    const { run, authClient } = setup({
      type: 'success',
      url: `${REDIRECT}#error=access_denied`,
    });

    await expect(run()).resolves.toBe('provider_error');
    expect(authClient.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('si Supabase rechaza el código, no queda sesión', async () => {
    const { run, storage, store } = setup(
      { type: 'success', url: `${REDIRECT}&code=vencido` },
      { ok: false, reason: 'invalid' },
    );

    await expect(run()).resolves.toBe('invalid');
    expect(storage.value).toBeNull();
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('sin configuración de Supabase no abre el navegador', async () => {
    const store = configureStore({ reducer: { auth: authSlice.reducer } });
    const browser = { createRedirectUrl: jest.fn(), openAuthSession: jest.fn() };

    const outcome = await signInWithGoogle(
      { authClient: null, storage: createMemoryTokenStorage() },
      browser,
      store.dispatch,
      PKCE,
    );

    expect(outcome).toBe('not_configured');
    expect(browser.openAuthSession).not.toHaveBeenCalled();
  });
});
