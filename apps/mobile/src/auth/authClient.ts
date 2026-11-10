import { z } from 'zod';

/**
 * Cliente mínimo de la API REST de Supabase Auth (decisión 0002).
 *
 * No se usa supabase-js en la app para que el intercambio PKCE, la renovación
 * y el cierre de sesión sean visibles y explicables. Cada función es una sola
 * petición HTTP.
 */

/** Respuesta de /auth/v1/token. Solo se leen los campos que usa la app. */
const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
  user: z.object({
    id: z.string(),
    email: z.string().nullish(),
  }),
});

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Momento de vencimiento del access_token, en milisegundos Unix. */
  expiresAt: number;
  user: SessionUser;
}

/**
 * Resultado de pedir una sesión:
 * - invalid: Supabase rechazó el código o el refresh_token (4xx); hay que
 *   volver a iniciar sesión.
 * - unavailable: no hubo respuesta útil (sin red, 5xx o respuesta inesperada);
 *   el refresh_token se conserva para intentarlo luego.
 */
export type SessionResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'invalid' | 'unavailable' };

export interface AuthClientConfig {
  supabaseUrl: string;
  publishableKey: string;
  fetchFn?: typeof fetch;
  now?: () => number;
}

export interface AuthClient {
  buildAuthorizeUrl(params: {
    provider: 'google';
    redirectTo: string;
    codeChallenge: string;
  }): string;
  exchangeCodeForSession(
    authCode: string,
    codeVerifier: string,
  ): Promise<SessionResult>;
  refreshSession(refreshToken: string): Promise<SessionResult>;
  signOut(accessToken: string): Promise<void>;
}

export function createAuthClient({
  supabaseUrl,
  publishableKey,
  fetchFn = (input, init) => fetch(input, init),
  now = Date.now,
}: AuthClientConfig): AuthClient {
  const authUrl = `${supabaseUrl}/auth/v1`;
  const baseHeaders = {
    apikey: publishableKey,
    'Content-Type': 'application/json',
  };

  async function requestSession(
    grantType: 'pkce' | 'refresh_token',
    body: Record<string, string>,
  ): Promise<SessionResult> {
    let response: Response;
    try {
      response = await fetchFn(`${authUrl}/token?grant_type=${grantType}`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, reason: 'unavailable' };
    }

    if (response.status >= 400 && response.status < 500) {
      return { ok: false, reason: 'invalid' };
    }
    if (!response.ok) {
      return { ok: false, reason: 'unavailable' };
    }

    const parsed = tokenResponseSchema.safeParse(
      await response.json().catch(() => null),
    );
    if (!parsed.success) {
      return { ok: false, reason: 'unavailable' };
    }

    const data = parsed.data;
    return {
      ok: true,
      session: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: now() + data.expires_in * 1000,
        user: { id: data.user.id, email: data.user.email ?? null },
      },
    };
  }

  return {
    buildAuthorizeUrl({ provider, redirectTo, codeChallenge }) {
      const query = new URLSearchParams({
        provider,
        redirect_to: redirectTo,
        code_challenge: codeChallenge,
        code_challenge_method: 's256',
      });
      return `${authUrl}/authorize?${query.toString()}`;
    },

    exchangeCodeForSession(authCode, codeVerifier) {
      return requestSession('pkce', {
        auth_code: authCode,
        code_verifier: codeVerifier,
      });
    },

    refreshSession(refreshToken) {
      return requestSession('refresh_token', { refresh_token: refreshToken });
    },

    async signOut(accessToken) {
      // scope=local cierra solo esta sesión, no las de otros dispositivos.
      // Es de mejor esfuerzo: el cierre local ocurre aunque esto falle.
      try {
        await fetchFn(`${authUrl}/logout?scope=local`, {
          method: 'POST',
          headers: { ...baseHeaders, Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // Sin red: el refresh_token igual se borra del dispositivo.
      }
    },
  };
}
