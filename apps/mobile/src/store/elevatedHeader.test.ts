import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query';
import { jsonResponse, makeSession } from '../testing/fakes';
import { authSlice, sessionStarted } from './authSlice';
import { createBaseQueryWithReauth } from './baseQueryWithReauth';
import { elevationGranted, stepUpSlice } from './stepUpSlice';

/** El elevated_token solo viaja a las acciones críticas y solo si está vigente. */

const NOW = Date.parse('2026-11-11T12:00:00.000Z');

function setup() {
  const fetchFn = jest.fn((_request: Request) => Promise.resolve(jsonResponse({})));
  const testApi = createApi({
    reducerPath: 'api',
    baseQuery: createBaseQueryWithReauth({
      baseUrl: 'https://api.example.com/api/',
      fetchFn: fetchFn as unknown as typeof fetch,
      refresh: () => Promise.resolve('unavailable'),
      elevatedEndpoints: ['exportMyData'],
      now: () => NOW,
    }),
    endpoints: (build) => ({
      exportMyData: build.mutation<unknown, void>({ query: () => 'me/data-export' }),
      getProfile: build.mutation<unknown, void>({ query: () => 'me/profile' }),
    }),
  });
  const store = configureStore({
    reducer: { auth: authSlice.reducer, stepUp: stepUpSlice.reducer, api: testApi.reducer },
    middleware: (getDefault) => getDefault().concat(testApi.middleware),
    enhancers: (getDefault) => getDefault({ autoBatch: { type: 'tick' } }),
  });
  store.dispatch(sessionStarted({ accessToken: 'access', expiresAt: 0, user: makeSession().user }));

  const elevatedHeaderOf = (call: number) =>
    fetchFn.mock.calls[call][0].headers.get('X-Elevated-Token');
  return { store, testApi, elevatedHeaderOf };
}

const grant = (expiresAt: string) =>
  elevationGranted({ elevatedToken: 'elevado', expiresAt });

describe('X-Elevated-Token', () => {
  it('se envía a la acción crítica y no a las demás', async () => {
    const { store, testApi, elevatedHeaderOf } = setup();
    store.dispatch(grant('2026-11-11T12:10:00.000Z'));

    await store.dispatch(testApi.endpoints.exportMyData.initiate());
    await store.dispatch(testApi.endpoints.getProfile.initiate());

    expect(elevatedHeaderOf(0)).toBe('elevado');
    expect(elevatedHeaderOf(1)).toBeNull();
  });

  it('no se envía si ya venció', async () => {
    const { store, testApi, elevatedHeaderOf } = setup();
    store.dispatch(grant('2026-11-11T11:59:00.000Z'));

    await store.dispatch(testApi.endpoints.exportMyData.initiate());

    expect(elevatedHeaderOf(0)).toBeNull();
  });
});
