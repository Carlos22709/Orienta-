import { configureStore } from '@reduxjs/toolkit';
import { authSlice, sessionStarted } from '../store/authSlice';
import {
  createFakeAuthClient,
  createMemoryTokenStorage,
  makeSession,
} from '../testing/fakes';
import {
  endSession,
  forgetSession,
  refreshStoredSession,
  restoreSession,
  startSession,
} from './session';

function createTestStore() {
  return configureStore({ reducer: { auth: authSlice.reducer } });
}

describe('sesión', () => {
  it('al renovar, guarda el refresh_token rotado y pone el access_token solo en Redux', async () => {
    const store = createTestStore();
    const storage = createMemoryTokenStorage('refresh-viejo');
    const authClient = createFakeAuthClient(() => ({
      ok: true,
      session: makeSession({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
    }));

    const outcome = await refreshStoredSession({ authClient, storage }, store.dispatch);

    expect(outcome).toBe('refreshed');
    expect(authClient.refreshSession).toHaveBeenCalledWith('refresh-viejo');
    expect(storage.value).toBe('refresh-2');
    const auth = store.getState().auth;
    expect(auth.status).toBe('signedIn');
    expect(auth.accessToken).toBe('access-2');
    // El refresh_token nunca entra al store.
    expect(JSON.stringify(auth)).not.toContain('refresh-2');
  });

  it('si Supabase rechaza el refresh_token, lo borra y cierra la sesión', async () => {
    const store = createTestStore();
    const storage = createMemoryTokenStorage('refresh-revocado');
    const authClient = createFakeAuthClient(() => ({ ok: false, reason: 'invalid' }));

    const outcome = await refreshStoredSession({ authClient, storage }, store.dispatch);

    expect(outcome).toBe('expired');
    expect(storage.value).toBeNull();
    expect(store.getState().auth).toMatchObject({
      status: 'signedOut',
      signedOutReason: 'expired',
      accessToken: null,
    });
  });

  it('sin red conserva el refresh_token para intentarlo después', async () => {
    const store = createTestStore();
    const storage = createMemoryTokenStorage('refresh-vigente');
    const authClient = createFakeAuthClient(() => ({ ok: false, reason: 'unavailable' }));

    const outcome = await restoreSession({ authClient, storage }, store.dispatch);

    expect(outcome).toBe('unavailable');
    expect(storage.value).toBe('refresh-vigente');
    expect(store.getState().auth).toMatchObject({
      status: 'signedOut',
      signedOutReason: 'unavailable',
    });
  });

  it('al abrir la app sin sesión guardada no llama a Supabase', async () => {
    const store = createTestStore();
    const authClient = createFakeAuthClient(() => ({ ok: false, reason: 'invalid' }));

    const outcome = await restoreSession(
      { authClient, storage: createMemoryTokenStorage() },
      store.dispatch,
    );

    expect(outcome).toBe('no_session');
    expect(authClient.refreshSession).not.toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      status: 'signedOut',
      signedOutReason: null,
    });
  });

  it('sin configuración de Supabase queda como no disponible', async () => {
    const store = createTestStore();

    const outcome = await restoreSession(
      { authClient: null, storage: createMemoryTokenStorage('refresh') },
      store.dispatch,
    );

    expect(outcome).toBe('unavailable');
    expect(store.getState().auth.status).toBe('signedOut');
  });

  it('iniciar y cerrar sesión deja el dispositivo limpio', async () => {
    const store = createTestStore();
    const storage = createMemoryTokenStorage();
    const authClient = createFakeAuthClient(() => ({ ok: false, reason: 'invalid' }));
    const deps = { authClient, storage };

    await startSession(deps, store.dispatch, makeSession());
    expect(storage.value).toBe('refresh-1');
    expect(store.getState().auth.accessToken).toBe('access-1');

    await endSession(deps, store.dispatch, store.getState().auth.accessToken);
    expect(authClient.signOut).toHaveBeenCalledWith('access-1');
    expect(storage.value).toBeNull();
    expect(store.getState().auth).toMatchObject({
      status: 'signedOut',
      signedOutReason: 'signedOut',
      accessToken: null,
      user: null,
    });
  });

  it('tras eliminar la cuenta borra la sesión local sin llamar a Supabase', async () => {
    const store = createTestStore();
    const storage = createMemoryTokenStorage('refresh-1');
    const authClient = createFakeAuthClient(() => ({ ok: false, reason: 'invalid' }));

    await forgetSession({ authClient, storage }, store.dispatch, 'deleted');

    expect(authClient.signOut).not.toHaveBeenCalled();
    expect(storage.value).toBeNull();
    expect(store.getState().auth).toMatchObject({
      status: 'signedOut',
      signedOutReason: 'deleted',
    });
  });

  it('una sesión nueva limpia el motivo del cierre anterior', () => {
    const store = createTestStore();
    store.dispatch(authSlice.actions.sessionEnded('expired'));

    store.dispatch(
      sessionStarted({ accessToken: 'a', expiresAt: 1, user: makeSession().user }),
    );

    expect(store.getState().auth.signedOutReason).toBeNull();
  });
});
