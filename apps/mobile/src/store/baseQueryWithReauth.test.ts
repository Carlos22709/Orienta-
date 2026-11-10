import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query';
import { refreshStoredSession } from '../auth/session';
import {
  createFakeAuthClient,
  createMemoryTokenStorage,
  jsonResponse,
  makeSession,
} from '../testing/fakes';
import { authSlice, sessionStarted } from './authSlice';
import { createBaseQueryWithReauth } from './baseQueryWithReauth';

/**
 * Prueba la cola de silent refresh con un store real, el refresh real
 * (refreshStoredSession) y dobles solo en los bordes: la red y Supabase Auth.
 */

type Handler = (request: Request) => Promise<Response>;

function setup({
  storedRefreshToken = 'refresh-1',
  refreshOk = true,
}: { storedRefreshToken?: string | null; refreshOk?: boolean } = {}) {
  const storage = createMemoryTokenStorage(storedRefreshToken);
  let rotation = 1;
  const authClient = createFakeAuthClient(() => {
    if (!refreshOk) return { ok: false, reason: 'invalid' };
    rotation += 1;
    return {
      ok: true,
      session: makeSession({
        accessToken: `access-${rotation}`,
        refreshToken: `refresh-${rotation}`,
      }),
    };
  });

  // Por defecto, la API falsa solo acepta el token más reciente emitido.
  let handler: Handler = (request) => {
    const valid = request.headers.get('Authorization') === `Bearer access-${rotation}`;
    return Promise.resolve(
      valid ? jsonResponse({ url: request.url }) : jsonResponse({ error: 'unauthorized' }, 401),
    );
  };
  const fetchFn = jest.fn((request: Request) => handler(request));

  const testApi = createApi({
    reducerPath: 'api',
    baseQuery: createBaseQueryWithReauth({
      baseUrl: 'https://api.example.com/api/',
      fetchFn: fetchFn as unknown as typeof fetch,
      refresh: ({ dispatch }) => refreshStoredSession({ authClient, storage }, dispatch),
    }),
    endpoints: (build) => ({
      item: build.query<unknown, number>({ query: (n) => `items/${n}` }),
    }),
  });

  const store = configureStore({
    reducer: { auth: authSlice.reducer, api: testApi.reducer },
    middleware: (getDefault) => getDefault().concat(testApi.middleware),
    // En Jest, requestAnimationFrame deja temporizadores vivos al terminar.
    enhancers: (getDefault) => getDefault({ autoBatch: { type: 'tick' } }),
  });

  const signIn = (accessToken: string) =>
    store.dispatch(sessionStarted({ accessToken, expiresAt: 0, user: makeSession().user }));
  const request = (n: number) => store.dispatch(testApi.endpoints.item.initiate(n));
  const setHandler = (next: Handler) => {
    handler = next;
  };

  return { store, storage, authClient, fetchFn, signIn, request, setHandler };
}

const authHeaders = (fetchFn: jest.Mock) =>
  fetchFn.mock.calls.map(([req]: [Request]) => req.headers.get('Authorization'));

describe('baseQueryWithReauth', () => {
  it('envía el access_token actual en Authorization', async () => {
    const { signIn, request, fetchFn } = setup();
    signIn('access-1');

    const result = await request(1);

    expect(result.isSuccess).toBe(true);
    expect(authHeaders(fetchFn)).toEqual(['Bearer access-1']);
  });

  it('varios 401 simultáneos disparan una sola renovación y todos se reintentan', async () => {
    const { signIn, request, authClient, storage, store, fetchFn } = setup();
    signIn('access-viejo');

    const results = await Promise.all([request(1), request(2), request(3)]);

    expect(results.every((r) => r.isSuccess)).toBe(true);
    expect(authClient.refreshSession).toHaveBeenCalledTimes(1);
    expect(authClient.refreshSession).toHaveBeenCalledWith('refresh-1');
    expect(storage.value).toBe('refresh-2');
    expect(store.getState().auth.accessToken).toBe('access-2');
    // 3 intentos con el token viejo y 3 reintentos con el nuevo.
    expect(authHeaders(fetchFn).sort()).toEqual([
      'Bearer access-2',
      'Bearer access-2',
      'Bearer access-2',
      'Bearer access-viejo',
      'Bearer access-viejo',
      'Bearer access-viejo',
    ]);
  });

  it('si la renovación falla, devuelve el 401 y deja la app sin sesión', async () => {
    const { signIn, request, storage, store, fetchFn } = setup({ refreshOk: false });
    signIn('access-viejo');

    const result = await request(1);

    expect(result.error).toMatchObject({ status: 401 });
    expect(fetchFn).toHaveBeenCalledTimes(1); // sin reintento
    expect(storage.value).toBeNull();
    expect(store.getState().auth).toMatchObject({
      status: 'signedOut',
      signedOutReason: 'expired',
    });
  });

  it('sin sesión, un 401 no intenta renovar', async () => {
    const { request, authClient, fetchFn } = setup();

    const result = await request(1);

    expect(result.error).toMatchObject({ status: 401 });
    expect(authClient.refreshSession).not.toHaveBeenCalled();
    expect(authHeaders(fetchFn)).toEqual([null]);
  });

  it('un 401 que llega después de otra renovación solo reintenta, sin renovar de nuevo', async () => {
    const { signIn, request, authClient, store, setHandler, fetchFn } = setup();
    signIn('access-viejo');

    // La petición queda viajando con el token viejo...
    let release!: () => void;
    setHandler(
      () =>
        new Promise((resolve) => {
          release = () => resolve(jsonResponse({ error: 'unauthorized' }, 401));
        }),
    );
    const pending = request(1);
    await new Promise((r) => setTimeout(r, 0));

    // ...mientras otra parte de la app ya obtuvo un token nuevo.
    store.dispatch(
      sessionStarted({ accessToken: 'access-nuevo', expiresAt: 0, user: makeSession().user }),
    );
    setHandler((req) => Promise.resolve(jsonResponse({ auth: req.headers.get('Authorization') })));
    release();

    const result = await pending;
    expect(result.isSuccess).toBe(true);
    expect(authClient.refreshSession).not.toHaveBeenCalled();
    expect(authHeaders(fetchFn)).toEqual(['Bearer access-viejo', 'Bearer access-nuevo']);
  });
});
