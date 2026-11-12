import { createApi } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';
import { refreshStoredSession } from '../auth/session';
import { sessionDeps } from '../auth/sessionDeps';
import { env } from '../config/env';
import type { ProfileUpdate } from '../profile/profileForm';
import { addSaved, removeSaved } from '../saved/savedList';
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

/** Contrato de GET /api/opportunities (todas las vigentes, para explorar). */
export const opportunityListSchema = z.object({
  items: z.array(recommendationItemSchema.omit({ reasons: true })),
});
export type OpportunityListItem = z.infer<typeof opportunityListSchema>['items'][number];

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

/** Opción { value, label } del catálogo, con etiqueta en lenguaje claro. */
const catalogOptionSchema = z.object({ value: z.string(), label: z.string() });
export type CatalogOption = z.infer<typeof catalogOptionSchema>;

/** Contrato de GET /api/catalog (opciones del formulario de perfil). */
export const catalogResponseSchema = z.object({
  municipalities: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      departmentName: z.string().optional(),
    }),
  ),
  categories: z.array(catalogOptionSchema),
  educationLevels: z.array(catalogOptionSchema),
  experienceLevels: z.array(catalogOptionSchema),
  situations: z.array(catalogOptionSchema),
  availabilities: z.array(catalogOptionSchema),
  consentVersion: z.string(),
});
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;

/** Contrato de GET y PUT /api/me/profile. profile es null si aún no existe. */
export const profileResponseSchema = z.object({
  profile: z
    .object({
      birthDate: z.string().nullable(),
      municipalityCode: z.string().nullable(),
      educationLevel: z.string().nullable(),
      experienceLevel: z.string().nullable(),
      currentSituation: z.string().nullable(),
      interests: z.array(z.string()),
      availability: z.string().nullable(),
      consentVersion: z.string(),
      consentedAt: z.string(),
    })
    .nullable(),
  missingFields: z.array(z.string()),
});
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

/** Contrato de GET /api/me/views (oportunidades ya abiertas, la más reciente primero). */
export const viewsResponseSchema = z.object({
  items: z.array(
    z.object({ opportunityId: z.string(), title: z.string(), firstViewedAt: z.string() }),
  ),
});
export type ViewedOpportunity = z.infer<typeof viewsResponseSchema>['items'][number];

/**
 * Contrato de GET /api/me/saved: oportunidades guardadas con el ♡, la más
 * reciente primero. Viven en el servidor, así que siguen a la persona al
 * cerrar sesión o cambiar de teléfono.
 */
export const savedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  entityName: z.string(),
  deadline: z.string().nullable(),
  validity: validitySchema,
  savedAt: z.string(),
});
export type SavedItem = z.infer<typeof savedItemSchema>;
/** Lo que necesita el ♡ para guardar una oportunidad (savedAt lo pone el servidor). */
export type SavedItemInput = Omit<SavedItem, 'savedAt'>;
export const savedListSchema = z.object({ items: z.array(savedItemSchema) });

/** Contrato de GET /api/mfa/status. */
export const mfaStatusSchema = z.object({ enrolled: z.boolean() });
export type MfaStatus = z.infer<typeof mfaStatusSchema>;

/**
 * Contrato de POST /api/mfa/enroll. La semilla se entrega una sola vez y la
 * app la guarda solo en el estado de la pantalla, nunca en Redux ni en disco.
 */
export const mfaEnrollmentSchema = z.object({
  otpauthUri: z.string().startsWith('otpauth://totp/'),
  secret: z.string().min(16),
});
export type MfaEnrollment = z.infer<typeof mfaEnrollmentSchema>;

/** Contrato de POST /api/mfa/verify. */
export const elevationSchema = z.object({
  elevatedToken: z.string().min(1),
  expiresAt: z.string(),
});
export type Elevation = z.infer<typeof elevationSchema>;

/** Contrato de GET /api/me/data-export (se conserva todo lo que llegue). */
export const dataExportSchema = z.looseObject({ exportedAt: z.string() });
export type DataExport = z.infer<typeof dataExportSchema>;

/**
 * Acciones críticas: solo a estos endpoints se les envía X-Elevated-Token
 * (decisión 0002, sección 5).
 */
export const ELEVATED_ENDPOINTS = ['exportMyData', 'deleteAccount'] as const;

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
  tagTypes: ['Health', 'Recommendations', 'Opportunity', 'Profile', 'Mfa', 'Saved'],
  baseQuery: createBaseQueryWithReauth({
    baseUrl: env.apiUrl ?? '',
    timeout: REQUEST_TIMEOUT_MS,
    refresh: ({ dispatch }) => refreshStoredSession(sessionDeps, dispatch),
    elevatedEndpoints: ELEVATED_ENDPOINTS,
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
    getOpportunities: build.query<OpportunityListItem[], void>({
      query: () => 'opportunities',
      transformResponse: (response: unknown) => opportunityListSchema.parse(response).items,
      providesTags: ['Opportunity'],
    }),
    getOpportunityById: build.query<OpportunityDetailResponse, string>({
      query: (id) => `opportunities/${id}`,
      transformResponse: (response: unknown) =>
        opportunityDetailResponseSchema.parse(response),
      providesTags: (_result, _error, id) => [{ type: 'Opportunity', id }],
    }),
    getCatalog: build.query<CatalogResponse, void>({
      query: () => 'catalog',
      transformResponse: (response: unknown) => catalogResponseSchema.parse(response),
    }),
    getProfile: build.query<ProfileResponse, void>({
      query: () => 'me/profile',
      transformResponse: (response: unknown) => profileResponseSchema.parse(response),
      providesTags: ['Profile'],
    }),
    // Guarda uno o varios pasos. Al cambiar el perfil, las recomendaciones
    // guardadas en caché dejan de ser válidas y se vuelven a pedir.
    updateProfile: build.mutation<ProfileResponse, ProfileUpdate>({
      query: (body) => ({ url: 'me/profile', method: 'PUT', body }),
      transformResponse: (response: unknown) => profileResponseSchema.parse(response),
      invalidatesTags: ['Profile', 'Recommendations'],
    }),

    getMyViews: build.query<ViewedOpportunity[], void>({
      query: () => 'me/views',
      transformResponse: (response: unknown) => viewsResponseSchema.parse(response).items,
    }),

    // Guardadas (♡). El corazón cambia al instante: se edita la caché de
    // getSaved antes de que responda el servidor y, si la petición falla,
    // patch.undo() deja la lista como estaba.
    getSaved: build.query<SavedItem[], void>({
      query: () => 'me/saved',
      transformResponse: (response: unknown) => savedListSchema.parse(response).items,
      providesTags: ['Saved'],
    }),
    saveOpportunity: build.mutation<null, SavedItemInput>({
      query: ({ id }) => ({ url: `me/saved/${encodeURIComponent(id)}`, method: 'PUT' }),
      async onQueryStarted(item, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData('getSaved', undefined, (list) =>
            addSaved(list, item, new Date().toISOString()),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    unsaveOpportunity: build.mutation<null, string>({
      query: (id) => ({ url: `me/saved/${encodeURIComponent(id)}`, method: 'DELETE' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData('getSaved', undefined, (list) => removeSaved(list, id)),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    // Verificación en dos pasos (decisión 0002, sección 4).
    getMfaStatus: build.query<MfaStatus, void>({
      query: () => 'mfa/status',
      transformResponse: (response: unknown) => mfaStatusSchema.parse(response),
      providesTags: ['Mfa'],
    }),
    startMfaEnrollment: build.mutation<MfaEnrollment, void>({
      query: () => ({ url: 'mfa/enroll', method: 'POST', body: {} }),
      transformResponse: (response: unknown) => mfaEnrollmentSchema.parse(response),
    }),
    confirmMfaEnrollment: build.mutation<MfaStatus, { code: string }>({
      query: (body) => ({ url: 'mfa/enroll/confirm', method: 'POST', body }),
      transformResponse: (response: unknown) => mfaStatusSchema.parse(response),
      invalidatesTags: ['Mfa'],
    }),
    verifyStepUp: build.mutation<Elevation, { stepUpToken: string; code: string }>({
      query: (body) => ({ url: 'mfa/verify', method: 'POST', body }),
      transformResponse: (response: unknown) => elevationSchema.parse(response),
    }),

    // Derechos de la Ley 1581 sobre los propios datos: exigen step-up.
    exportMyData: build.mutation<DataExport, void>({
      query: () => ({ url: 'me/data-export', method: 'GET' }),
      transformResponse: (response: unknown) => dataExportSchema.parse(response),
    }),
    deleteAccount: build.mutation<null, void>({
      query: () => ({ url: 'me', method: 'DELETE' }),
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetRecommendationsQuery,
  useGetOpportunitiesQuery,
  useGetOpportunityByIdQuery,
  useGetCatalogQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetMyViewsQuery,
  useGetSavedQuery,
  useSaveOpportunityMutation,
  useUnsaveOpportunityMutation,
  useGetMfaStatusQuery,
  useStartMfaEnrollmentMutation,
  useConfirmMfaEnrollmentMutation,
  useVerifyStepUpMutation,
  useExportMyDataMutation,
  useDeleteAccountMutation,
} = api;
