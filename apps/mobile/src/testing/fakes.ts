import type { AuthClient, Session, SessionResult } from '../auth/authClient';
import type { TokenStorage } from '../auth/tokenStorage';

/**
 * Dobles de prueba en memoria. Los tokens son ficticios y solo se usan en
 * pruebas (AGENTS.md).
 */

export function createMemoryTokenStorage(
  initial: string | null = null,
): TokenStorage & { value: string | null } {
  const storage = {
    value: initial,
    getRefreshToken: () => Promise.resolve(storage.value),
    setRefreshToken: (token: string) => {
      storage.value = token;
      return Promise.resolve();
    },
    clear: () => {
      storage.value = null;
      return Promise.resolve();
    },
  };
  return storage;
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresAt: 1_800_000_000_000,
    user: { id: 'user-1', email: 'prueba@example.com' },
    ...overrides,
  };
}

/** Cliente de Auth falso: refreshSession responde con lo que diga la prueba. */
export function createFakeAuthClient(
  refreshResult: (refreshToken: string) => SessionResult,
) {
  const client = {
    buildAuthorizeUrl: jest.fn(() => 'https://example.com/authorize'),
    exchangeCodeForSession: jest.fn(),
    refreshSession: jest.fn((refreshToken: string) =>
      Promise.resolve(refreshResult(refreshToken)),
    ),
    signOut: jest.fn(() => Promise.resolve()),
  } satisfies AuthClient;
  return client;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
