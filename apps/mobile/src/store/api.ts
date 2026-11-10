import { createApi } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';
import { refreshStoredSession } from '../auth/session';
import { sessionDeps } from '../auth/sessionDeps';
import { env } from '../config/env';
import { createBaseQueryWithReauth } from './baseQueryWithReauth';

/** Contrato de GET /api/health (ver docs/architecture/diseno-backend.md). */
const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Tiempo máximo de espera por petición antes de mostrar el estado de error. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Cliente de la API propia (Supabase Edge Function "api").
 *
 * Todas las peticiones pasan por la cola de silent refresh de la decisión
 * 0002: si la API responde 401, se renueva la sesión una sola vez y se
 * reintenta.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: createBaseQueryWithReauth({
    baseUrl: env.apiUrl ?? '',
    timeout: REQUEST_TIMEOUT_MS,
    refresh: ({ dispatch }) => refreshStoredSession(sessionDeps, dispatch),
  }),
  endpoints: (build) => ({
    getHealth: build.query<HealthResponse, void>({
      query: () => 'health',
      // Valida la respuesta en el límite del sistema (AGENTS.md).
      responseSchema: healthResponseSchema,
    }),
  }),
});

export const { useGetHealthQuery } = api;
