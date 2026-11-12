import { configureStore } from '@reduxjs/toolkit';
import { api, type SavedItem } from '../store/api';
import { authSlice, sessionEnded, sessionStarted } from '../store/authSlice';
import { jsonResponse, makeSession } from '../testing/fakes';
import { addSaved, removeSaved } from './savedList';

// La API real necesita una URL base; en las pruebas apunta a un dominio ficticio.
jest.mock('../config/env', () => ({
  env: { apiUrl: 'https://api.example.com/api/', supabaseUrl: null, supabasePublishableKey: null },
}));

const item = (id: string, savedAt = '2026-11-12T10:00:00.000Z'): SavedItem => ({
  id,
  title: `Oportunidad ${id}`,
  category: 'training',
  entityName: 'Entidad de prueba',
  deadline: null,
  validity: { kind: 'open' },
  savedAt,
});
const input = (id: string) => {
  const { savedAt: _savedAt, ...rest } = item(id);
  return rest;
};

describe('addSaved y removeSaved', () => {
  it('la última guardada queda primero', () => {
    const list = addSaved([item('a')], input('b'), '2026-11-12T11:00:00.000Z');
    expect(list?.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('guardar una que ya estaba no la duplica', () => {
    const list = [item('a')];
    expect(addSaved(list, input('a'), '2026-11-12T11:00:00.000Z')).toBe(list);
  });

  it('si la lista no se pudo cargar (sin datos en caché), no falla y no inventa una', () => {
    // RTK Query llama a la receta con undefined cuando GET /me/saved falló.
    expect(addSaved(undefined, input('a'), '2026-11-12T11:00:00.000Z')).toBeUndefined();
    expect(removeSaved(undefined, 'a')).toBeUndefined();
  });

  it('quitar deja el resto en el mismo orden', () => {
    expect(removeSaved([item('a'), item('b'), item('c')], 'b')?.map((s) => s.id)).toEqual(['a', 'c']);
  });
});

/** Store con la API real y la red reemplazada por un doble. */
function setup(server: { list: SavedItem[]; failWrites?: boolean }) {
  const fetchMock = jest.fn(async (request: Request) => {
    if (request.method === 'GET') return jsonResponse({ items: server.list });
    if (server.failWrites) return jsonResponse({ error: 'internal_error' }, 500);
    return new Response(null, { status: 204 });
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  const store = configureStore({
    reducer: { auth: authSlice.reducer, api: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
    enhancers: (getDefault) => getDefault({ autoBatch: { type: 'tick' } }),
  });
  store.dispatch(sessionStarted({ accessToken: 'access-1', expiresAt: 0, user: makeSession().user }));

  const savedIds = () =>
    (api.endpoints.getSaved.select()(store.getState()).data ?? []).map((s) => s.id);

  return { store, fetchMock, savedIds };
}

describe('guardadas en el servidor', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('el ♡ aparece al instante y se envía PUT /me/saved/:id', async () => {
    const { store, fetchMock, savedIds } = setup({ list: [item('a')] });
    await store.dispatch(api.endpoints.getSaved.initiate());

    const pending = store.dispatch(api.endpoints.saveOpportunity.initiate(input('b')));
    expect(savedIds()).toEqual(['b', 'a']);
    await pending;

    expect(savedIds()).toEqual(['b', 'a']);
    const put = fetchMock.mock.calls.map(([req]) => req).find((req) => req.method === 'PUT');
    expect(put?.url).toBe('https://api.example.com/api/me/saved/b');
  });

  it('si el servidor falla, el ♡ vuelve a como estaba', async () => {
    const { store, savedIds } = setup({ list: [item('a')], failWrites: true });
    await store.dispatch(api.endpoints.getSaved.initiate());

    const result = await store.dispatch(api.endpoints.unsaveOpportunity.initiate('a'));

    expect('error' in result).toBe(true);
    expect(savedIds()).toEqual(['a']);
  });

  it('cerrar sesión no borra las guardadas: al volver a entrar siguen en el servidor', async () => {
    const server = { list: [item('a')] };
    const { store, savedIds } = setup(server);
    await store.dispatch(api.endpoints.getSaved.initiate());

    // signOut() termina la sesión y vacía la caché (src/auth/actions.ts).
    store.dispatch(sessionEnded('signedOut'));
    store.dispatch(api.util.resetApiState());
    expect(savedIds()).toEqual([]);

    store.dispatch(sessionStarted({ accessToken: 'access-2', expiresAt: 0, user: makeSession().user }));
    await store.dispatch(api.endpoints.getSaved.initiate());
    expect(savedIds()).toEqual(['a']);
  });
});
