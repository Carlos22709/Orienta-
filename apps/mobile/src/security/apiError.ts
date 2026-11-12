import { z } from 'zod';

/**
 * Lee un error de RTK Query con el formato de la API propia:
 * { error: "<código>", message: "<texto en lenguaje claro>", ...extra }
 * (ver docs/architecture/diseno-backend.md).
 */
const apiErrorBodySchema = z.looseObject({
  error: z.string(),
  message: z.string(),
  stepUpToken: z.string().optional(),
  expiresAt: z.string().optional(),
});

export interface ApiError {
  /** Código HTTP; null si no hubo respuesta (red, tiempo agotado). */
  status: number | null;
  /** Código de error de la API, o "network" si no hubo una respuesta legible. */
  code: string;
  message: string;
  stepUpToken?: string;
}

export const NETWORK_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

export function readApiError(error: unknown): ApiError {
  const status = (error as { status?: unknown } | null)?.status;
  const body = apiErrorBodySchema.safeParse(
    (error as { data?: unknown } | null)?.data,
  );
  if (typeof status !== 'number' || !body.success) {
    return {
      status: typeof status === 'number' ? status : null,
      code: 'network',
      message: NETWORK_MESSAGE,
    };
  }
  return {
    status,
    code: body.data.error,
    message: body.data.message,
    stepUpToken: body.data.stepUpToken,
  };
}
