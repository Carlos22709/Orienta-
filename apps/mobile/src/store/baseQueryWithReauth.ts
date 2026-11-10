import {
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import type { RefreshOutcome } from '../auth/session';
import { singleFlight } from '../auth/singleFlight';
import type { AuthState } from './authSlice';

export interface ReauthOptions {
  baseUrl: string;
  timeout?: number;
  fetchFn?: typeof fetch;
  /** Renueva la sesión y actualiza el store. Se llama una vez por ráfaga de 401. */
  refresh: (api: BaseQueryApi) => Promise<RefreshOutcome>;
}

function accessTokenOf(api: BaseQueryApi): string | null {
  return (api.getState() as { auth: AuthState }).auth.accessToken;
}

/**
 * baseQuery con cola de silent refresh (decisión 0002, sección 3).
 *
 * 1. Cada petición lleva el access_token actual del store.
 * 2. Si la API responde 401, se lanza una sola renovación; las demás
 *    peticiones que fallen mientras tanto esperan esa misma promesa.
 * 3. Si la renovación funciona, cada petición se reintenta una vez con el
 *    token nuevo. Si no, se devuelve el 401 original; el store ya quedó sin
 *    sesión (o con la sesión anterior si Supabase no respondió).
 */
export function createBaseQueryWithReauth({
  baseUrl,
  timeout,
  fetchFn,
  refresh,
}: ReauthOptions): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    timeout,
    fetchFn,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: AuthState }).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });
  const refreshOnce = singleFlight(refresh);

  return async (args, api, extraOptions) => {
    const tokenSent = accessTokenOf(api);
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error?.status !== 401 || !tokenSent) {
      return result;
    }

    // Si otra petición ya renovó la sesión mientras esta viajaba, no hace
    // falta renovar de nuevo: basta con reintentar con el token actual.
    if (accessTokenOf(api) === tokenSent) {
      const outcome = await refreshOnce(api);
      if (outcome !== 'refreshed') {
        return result;
      }
    }
    if (!accessTokenOf(api)) {
      return result;
    }
    return rawBaseQuery(args, api, extraOptions);
  };
}
