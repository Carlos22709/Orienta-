import { jsonResponse } from '../testing/fakes';
import { createAuthClient } from './authClient';

const SUPABASE_URL = 'https://proyecto.example.com';
const KEY = 'clave-publishable-de-prueba';
const NOW = 1_800_000_000_000;

function setup(response: () => Promise<Response>) {
  const fetchFn = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    response(),
  );
  const client = createAuthClient({
    supabaseUrl: SUPABASE_URL,
    publishableKey: KEY,
    fetchFn: fetchFn as unknown as typeof fetch,
    now: () => NOW,
  });
  return { client, fetchFn };
}

const TOKEN_BODY = {
  access_token: 'access-nuevo',
  refresh_token: 'refresh-nuevo',
  expires_in: 300,
  token_type: 'bearer',
  user: { id: 'user-1', email: 'prueba@example.com' },
};

describe('createAuthClient', () => {
  it('renueva la sesión con grant_type=refresh_token y la clave publishable', async () => {
    const { client, fetchFn } = setup(() => Promise.resolve(jsonResponse(TOKEN_BODY)));

    const result = await client.refreshSession('refresh-viejo');

    expect(result).toEqual({
      ok: true,
      session: {
        accessToken: 'access-nuevo',
        refreshToken: 'refresh-nuevo',
        expiresAt: NOW + 300_000,
        user: { id: 'user-1', email: 'prueba@example.com' },
      },
    });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ apikey: KEY });
    expect(JSON.parse(String(init?.body))).toEqual({
      refresh_token: 'refresh-viejo',
    });
  });

  it('canjea el código PKCE con auth_code y code_verifier', async () => {
    const { client, fetchFn } = setup(() => Promise.resolve(jsonResponse(TOKEN_BODY)));

    await client.exchangeCodeForSession('codigo', 'verificador');

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`);
    expect(JSON.parse(String(init?.body))).toEqual({
      auth_code: 'codigo',
      code_verifier: 'verificador',
    });
  });

  it('un 4xx de Supabase significa que hay que volver a iniciar sesión', async () => {
    const { client } = setup(() =>
      Promise.resolve(jsonResponse({ error_code: 'refresh_token_not_found' }, 400)),
    );

    await expect(client.refreshSession('x')).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it.each<[string, () => Promise<Response>]>([
    ['sin red', () => Promise.reject(new TypeError('Network request failed'))],
    ['error 5xx', () => Promise.resolve(jsonResponse({}, 503))],
    ['respuesta inesperada', () => Promise.resolve(jsonResponse({ ok: true }))],
  ])('%s: queda como no disponible y no como sesión inválida', async (_, response) => {
    const { client } = setup(response);

    await expect(client.refreshSession('x')).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('arma la URL de autorización con PKCE S256', () => {
    const { client } = setup(() => Promise.resolve(jsonResponse({})));

    const url = new URL(
      client.buildAuthorizeUrl({
        provider: 'google',
        redirectTo: 'exp://192.168.0.10:8081/--/auth/callback?state=abc',
        codeChallenge: 'reto',
      }),
    );

    expect(url.origin + url.pathname).toBe(`${SUPABASE_URL}/auth/v1/authorize`);
    expect(url.searchParams.get('provider')).toBe('google');
    expect(url.searchParams.get('redirect_to')).toBe(
      'exp://192.168.0.10:8081/--/auth/callback?state=abc',
    );
    expect(url.searchParams.get('code_challenge')).toBe('reto');
    expect(url.searchParams.get('code_challenge_method')).toBe('s256');
  });

  it('el cierre de sesión no falla aunque no haya red', async () => {
    const { client, fetchFn } = setup(() =>
      Promise.reject(new TypeError('Network request failed')),
    );

    await expect(client.signOut('access')).resolves.toBeUndefined();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${SUPABASE_URL}/auth/v1/logout?scope=local`);
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer access' });
  });
});
