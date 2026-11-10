import { createApi } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';
import { refreshStoredSession } from '../auth/session';
import { sessionDeps } from '../auth/sessionDeps';
import { env } from '../config/env';
import { createBaseQueryWithReauth } from './baseQueryWithReauth';

/** Contrato de GET /api/health (ver docs/architecture/diseno-backend.md). */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Contrato de vigencia de una convocatoria. */
export const validitySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('open') }),
  z.object({ kind: z.literal('closing_soon'), daysLeft: z.number() }),
  z.object({ kind: z.literal('closed') }),
]);
export type Validity = z.infer<typeof validitySchema>;

/** Contrato de un ítem de recomendación en la lista. */
export const recommendationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summaryPlain: z.string(),
  category: z.string(),
  entityName: z.string(),
  modality: z.string(),
  deadline: z.string().nullable(),
  validity: validitySchema,
  reasons: z.array(z.string()),
});
export type RecommendationItem = z.infer<typeof recommendationItemSchema>;

/** Contrato de GET /api/recommendations (devuelve 4 o 5 recomendaciones). */
export const recommendationsResponseSchema = z.object({
  items: z.array(recommendationItemSchema),
  insufficient: z.boolean(),
  message: z.string().nullable(),
});
export type RecommendationsResponse = z.infer<typeof recommendationsResponseSchema>;

/** Contrato de GET /api/opportunities/:id (detalle completo). */
export const opportunityDetailResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  summaryPlain: z.string(),
  category: z.string(),
  entityName: z.string(),
  officialUrl: z.string(),
  sourceUrl: z.string(),
  deadline: z.string().nullable(),
  minAge: z.number().nullable().optional(),
  maxAge: z.number().nullable().optional(),
  minEducation: z.string().nullable().optional(),
  minExperience: z.string().nullable().optional(),
  availability: z.array(z.string()).nullable().optional(),
  municipalityCodes: z.array(z.string()).nullable().optional(),
  modality: z.string(),
  requirements: z.array(z.string()),
  verifiedBy: z.string(),
  verifiedAt: z.string(),
  validity: validitySchema,
});
export type OpportunityDetailResponse = z.infer<typeof opportunityDetailResponseSchema>;

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
  tagTypes: ['Health', 'Recommendations', 'Opportunity'],
  baseQuery: createBaseQueryWithReauth({
    baseUrl: env.apiUrl ?? '',
    timeout: REQUEST_TIMEOUT_MS,
    refresh: ({ dispatch }) => refreshStoredSession(sessionDeps, dispatch),
  }),
  endpoints: (build) => ({
    getHealth: build.query<HealthResponse, void>({
      query: () => 'health',
      transformResponse: (response: unknown) => healthResponseSchema.parse(response),
      providesTags: ['Health'],
    }),
    getRecommendations: build.query<RecommendationsResponse, void>({
      query: () => 'recommendations',
      transformResponse: (response: unknown) =>
        recommendationsResponseSchema.parse(response),
      providesTags: ['Recommendations'],
    }),
    getOpportunityById: build.query<OpportunityDetailResponse, string>({
      query: (id) => `opportunities/${id}`,
      transformResponse: (response: unknown) =>
        opportunityDetailResponseSchema.parse(response),
      providesTags: (_result, _error, id) => [{ type: 'Opportunity', id }],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetRecommendationsQuery,
  useGetOpportunityByIdQuery,
} = api;
