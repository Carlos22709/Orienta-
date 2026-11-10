import { Hono } from "hono";
import { z } from "zod";
import { encodeBase32 } from "../../_shared/security/base32.ts";
import { signElevatedToken } from "../../_shared/security/elevated-token.ts";
import {
  decryptSecret,
  encryptSecret,
  importEncryptionKey,
} from "../../_shared/security/secret-encryption.ts";
import { hashStepUpToken } from "../../_shared/security/step-up-token.ts";
import {
  buildOtpauthUri,
  generateSecret,
  verifyTotp,
} from "../../_shared/security/totp.ts";
import type { AppDependencies, MfaFactor } from "../deps.ts";
import { errorBody } from "../http/errors.ts";
import { requireSecret } from "../http/secrets.ts";
import { type AppEnv, requireUser } from "../middleware/auth.ts";

const ISSUER = "Orienta+";

const confirmSchema = z.object({ code: z.string() }).strict();
const verifySchema = z.object({ stepUpToken: z.string(), code: z.string() })
  .strict();

const INVALID_CODE = errorBody(
  "invalid_code",
  "El código no es válido. Escribe los 6 dígitos que muestra ahora tu app autenticadora.",
);
const REPLAY = errorBody(
  "replay_detected",
  "Este código ya se usó. Espera a que tu app autenticadora muestre uno nuevo.",
);
const STEP_UP_EXPIRED = errorBody(
  "step_up_expired",
  "La verificación venció o ya se usó. Intenta de nuevo la acción.",
);
const INVALID_BODY = errorBody(
  "validation_error",
  "Falta el código de verificación.",
);

/**
 * Segundo factor TOTP (decisión 0002). La verificación del código es propia
 * (_shared/security/totp.ts); el anti-replay se garantiza en Postgres.
 *
 * Nota: los errores de código usan 422 y no 401, porque 401 hace que la app
 * intente renovar la sesión.
 */
export function mfaRoutes(deps: AppDependencies) {
  const app = new Hono<AppEnv>();
  app.use("*", requireUser(deps.auth));

  async function encryptionKey() {
    return await importEncryptionKey(
      requireSecret(deps.secrets, "totpEncryptionKey"),
    );
  }

  async function decryptFactorSecret(factor: MfaFactor) {
    return await decryptSecret(await encryptionKey(), {
      ciphertext: factor.secretCiphertext,
      iv: factor.secretIv,
    });
  }

  const unixSeconds = () => Math.floor(deps.now().getTime() / 1000);

  // GET /api/mfa/status
  app.get("/status", async (c) => {
    const factor = await deps.repository.getMfaFactor(c.get("user").id);
    return c.json({ enrolled: Boolean(factor?.confirmedAt) });
  });

  // POST /api/mfa/enroll: genera la semilla y la entrega una sola vez.
  app.post("/enroll", async (c) => {
    const user = c.get("user");
    const current = await deps.repository.getMfaFactor(user.id);
    if (current?.confirmedAt) {
      return c.json(
        errorBody(
          "mfa_already_enrolled",
          "La verificación en dos pasos ya está activa.",
        ),
        409,
      );
    }

    const secret = generateSecret();
    await deps.repository.startMfaEnrollment(
      user.id,
      await encryptSecret(await encryptionKey(), secret),
    );
    return c.json({
      otpauthUri: buildOtpauthUri({
        secret,
        accountName: user.email ?? user.id,
        issuer: ISSUER,
      }),
      // Semilla en Base32 para escribirla a mano si no se puede escanear el QR.
      secret: encodeBase32(secret),
    }, 201);
  });

  // POST /api/mfa/enroll/confirm: activa el factor con un primer código válido.
  app.post("/enroll/confirm", async (c) => {
    const user = c.get("user");
    const body = confirmSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(INVALID_BODY, 422);

    const factor = await deps.repository.getMfaFactor(user.id);
    if (!factor || factor.confirmedAt) {
      return c.json(
        errorBody(
          "mfa_not_pending",
          "No hay una activación de verificación en dos pasos pendiente.",
        ),
        409,
      );
    }

    const result = await verifyTotp({
      secret: await decryptFactorSecret(factor),
      code: body.data.code,
      unixSeconds: unixSeconds(),
    });
    if (!result.ok) return c.json(INVALID_CODE, 422);

    const confirmed = await deps.repository.confirmMfaFactor(
      user.id,
      result.step,
      deps.now().toISOString(),
    );
    if (!confirmed) {
      return c.json(
        errorBody("mfa_not_pending", "La activación ya no está pendiente."),
        409,
      );
    }
    return c.json({ enrolled: true });
  });

  // POST /api/mfa/verify: canjea step_up_token + código por un elevated_token.
  app.post("/verify", async (c) => {
    const user = c.get("user");
    const body = verifySchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json(INVALID_BODY, 422);

    // 1. El reto debe existir, ser de esta persona y estar vigente.
    const tokenHash = await hashStepUpToken(body.data.stepUpToken);
    const challenge = await deps.repository.findActiveStepUpChallenge(
      tokenHash,
      user.id,
      deps.now(),
    );
    if (!challenge) return c.json(STEP_UP_EXPIRED, 410);

    const factor = await deps.repository.getMfaFactor(user.id);
    if (!factor?.confirmedAt) return c.json(STEP_UP_EXPIRED, 410);

    // 2. Código TOTP (ventanas C-1, C, C+1) con chequeo previo de repetición.
    const result = await verifyTotp({
      secret: await decryptFactorSecret(factor),
      code: body.data.code,
      unixSeconds: unixSeconds(),
      lastUsedStep: factor.lastUsedStep,
    });
    if (!result.ok) {
      return result.reason === "replayed"
        ? c.json(REPLAY, 409)
        : c.json(INVALID_CODE, 422);
    }

    // 3. Anti-replay atómico: dos peticiones simultáneas no pasan ambas.
    if (!(await deps.repository.consumeTotpStep(user.id, result.step))) {
      return c.json(REPLAY, 409);
    }

    // 4. El reto se consume una sola vez.
    if (!(await deps.repository.consumeStepUpChallenge(tokenHash))) {
      return c.json(STEP_UP_EXPIRED, 410);
    }

    const { token, expiresAt } = await signElevatedToken(
      requireSecret(deps.secrets, "elevatedTokenSecret"),
      user.id,
      deps.now(),
    );
    return c.json({ elevatedToken: token, expiresAt });
  });

  return app;
}
