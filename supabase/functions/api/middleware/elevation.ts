import type { MiddlewareHandler } from "hono";
import { verifyElevatedToken } from "../../_shared/security/elevated-token.ts";
import { createStepUpToken } from "../../_shared/security/step-up-token.ts";
import type { AppDependencies, CriticalAction } from "../deps.ts";
import { errorBody } from "../http/errors.ts";
import { requireSecret } from "../http/secrets.ts";
import type { AppEnv } from "./auth.ts";

/** Vigencia del step_up_token (decisión 0002). */
export const STEP_UP_TTL_SECONDS = 5 * 60;

/**
 * Step-up (decisión 0002). Se usa después de requireUser en las acciones
 * críticas. Deja pasar la petición solo si trae un elevated_token válido de
 * esta misma persona en el encabezado X-Elevated-Token. Si no:
 * - sin 2FA activo → 403 mfa_enrollment_required;
 * - con 2FA activo → crea un reto de un solo uso y responde
 *   403 mfa_required con el stepUpToken que la app debe devolver junto con
 *   el código en POST /api/mfa/verify.
 */
export function requireElevation(
  deps: AppDependencies,
  action: CriticalAction,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");
    const now = deps.now();
    const secret = requireSecret(deps.secrets, "elevatedTokenSecret");

    const elevatedToken = c.req.header("X-Elevated-Token");
    if (
      elevatedToken &&
      await verifyElevatedToken(secret, elevatedToken, user.id, now)
    ) {
      await next();
      return;
    }

    const factor = await deps.repository.getMfaFactor(user.id);
    if (!factor?.confirmedAt) {
      return c.json(
        errorBody(
          "mfa_enrollment_required",
          "Para proteger esta acción, primero activa la verificación en dos pasos.",
        ),
        403,
      );
    }

    const { token, hash } = await createStepUpToken();
    const expiresAt = new Date(now.getTime() + STEP_UP_TTL_SECONDS * 1000)
      .toISOString();
    await deps.repository.createStepUpChallenge({
      userId: user.id,
      tokenHash: hash,
      action,
      expiresAt,
    });
    return c.json(
      errorBody(
        "mfa_required",
        "Confirma que eres tú con el código de tu app autenticadora.",
        { stepUpToken: token, expiresAt },
      ),
      403,
    );
  };
}
