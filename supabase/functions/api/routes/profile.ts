import { Hono } from "hono";
import { CONSENT_VERSION } from "../../_shared/catalog/consent.ts";
import { ageOn, toLocalDate } from "../../_shared/domain/dates.ts";
import type { AppDependencies, StoredProfile } from "../deps.ts";
import { errorBody } from "../http/errors.ts";
import { type AppEnv, requireUser } from "../middleware/auth.ts";
import { findMissingFields } from "../profile-completeness.ts";
import {
  FIELD_MESSAGES,
  profileUpdateSchema,
  toFieldErrors,
} from "../schemas/profile.ts";

/** Rango de edad de Orienta+ (propuesta de producto, Fase 1). */
const MIN_AGE = 18;
const MAX_AGE = 29;

/** GET y PUT /api/me/profile: perfil de la persona autenticada. */
export function profileRoutes(deps: AppDependencies) {
  const app = new Hono<AppEnv>();
  app.use("*", requireUser(deps.auth));

  app.get("/", async (c) => {
    const profile = await deps.repository.getProfile(c.get("user").id);
    return c.json({ profile, missingFields: findMissingFields(profile) });
  });

  app.put("/", async (c) => {
    const user = c.get("user");

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("invalid_json", "La solicitud no tiene un formato válido."),
        400,
      );
    }

    // 1. Forma de los datos (Zod).
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(validationError(toFieldErrors(parsed.error)), 422);
    }
    const update = parsed.data;

    // 2. Reglas que dependen de la fecha actual o de la base de datos.
    const fields: Record<string, string> = {};
    if (update.birthDate !== undefined) {
      const ageError = validateAge(update.birthDate, deps.now());
      if (ageError) fields.birthDate = ageError;
    }
    if (
      update.municipalityCode !== undefined &&
      !(await deps.repository.isMunicipalityInScope(update.municipalityCode))
    ) {
      fields.municipalityCode = FIELD_MESSAGES.municipalityCode;
    }
    if (update.consent && update.consent.version !== CONSENT_VERSION) {
      fields.consent = FIELD_MESSAGES.consent;
    }
    if (Object.keys(fields).length > 0) {
      return c.json(validationError(fields), 422);
    }

    // 3. Sin consentimiento no se crea el perfil (Ley 1581 de 2012).
    const current = await deps.repository.getProfile(user.id);
    if (!current && !update.consent) {
      return c.json(
        errorBody(
          "consent_required",
          "Para guardar tu perfil necesitamos que aceptes el tratamiento de tus datos.",
        ),
        409,
      );
    }

    // 4. Combina el paso nuevo con lo ya guardado.
    const { consent, interests, ...rest } = update;
    const merged: StoredProfile = {
      ...(current ?? EMPTY_PROFILE),
      ...rest,
      ...(interests ? { interests: [...new Set(interests)] } : {}),
      ...(consent
        ? {
          consentVersion: consent.version,
          consentedAt: deps.now().toISOString(),
        }
        : {}),
    };
    const saved = await deps.repository.saveProfile(user.id, merged);
    return c.json({ profile: saved, missingFields: findMissingFields(saved) });
  });

  return app;
}

const EMPTY_PROFILE: StoredProfile = {
  birthDate: null,
  municipalityCode: null,
  educationLevel: null,
  experienceLevel: null,
  currentSituation: null,
  interests: [],
  availability: null,
  consentVersion: "",
  consentedAt: "",
};

function validationError(fields: Record<string, string>) {
  return errorBody(
    "validation_error",
    "Revisa los datos marcados.",
    { fields },
  );
}

function validateAge(birthDate: string, now: Date): string | null {
  let age: number;
  try {
    age = ageOn(birthDate, toLocalDate(now));
  } catch {
    return FIELD_MESSAGES.birthDate; // fecha inexistente, por ejemplo 2007-02-30
  }
  if (age < MIN_AGE || age > MAX_AGE) {
    return `Orienta+ está dirigida a personas de ${MIN_AGE} a ${MAX_AGE} años.`;
  }
  return null;
}
