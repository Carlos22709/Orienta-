import { env } from '../config/env';
import { createAuthClient } from './authClient';
import type { SessionDeps } from './session';
import { secureTokenStorage } from './tokenStorage';

/** Dependencias reales de la sesión, armadas a partir del .env. */
export const sessionDeps: SessionDeps = {
  authClient:
    env.supabaseUrl && env.supabasePublishableKey
      ? createAuthClient({
          supabaseUrl: env.supabaseUrl,
          publishableKey: env.supabasePublishableKey,
        })
      : null,
  storage: secureTokenStorage,
};
