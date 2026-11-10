import { Hono } from "hono";
import { CONSENT_VERSION } from "../../_shared/catalog/consent.ts";
import {
  AVAILABILITY_LABELS,
  CATEGORY_LABELS,
  EDUCATION_LABELS,
  EXPERIENCE_LABELS,
  SITUATION_LABELS,
  toOptions,
} from "../../_shared/catalog/labels.ts";
import type { AppDependencies } from "../deps.ts";

/** GET /api/catalog (público): opciones del formulario de perfil. */
export function catalogRoutes(deps: AppDependencies) {
  return new Hono().get("/", async (c) =>
    c.json({
      municipalities: await deps.repository.listMunicipalities(),
      categories: toOptions(CATEGORY_LABELS),
      educationLevels: toOptions(EDUCATION_LABELS),
      experienceLevels: toOptions(EXPERIENCE_LABELS),
      situations: toOptions(SITUATION_LABELS),
      availabilities: toOptions(AVAILABILITY_LABELS),
      consentVersion: CONSENT_VERSION,
    }));
}
