import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';
import { env } from '../config/env';

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
 * La cola de silent refresh de la decisión 0002 se agregará aquí, envolviendo
 * fetchBaseQuery en un baseQueryWithReauth, cuando exista la autenticación.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiUrl ?? '',
    timeout: REQUEST_TIMEOUT_MS,
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
