import { Hono } from "hono";
import { recommend } from "../../_shared/domain/recommendation.ts";
import type { AppDependencies } from "../deps.ts";
import { errorBody } from "../http/errors.ts";
import { type AppEnv, requireUser } from "../middleware/auth.ts";
import {
  findMissingFields,
  toCompleteProfile,
} from "../profile-completeness.ts";

const NO_RESULTS_MESSAGE =
  "Por ahora no encontramos oportunidades vigentes para tu perfil. Revisa tus datos o vuelve pronto: revisamos las convocatorias cada semana.";
const FEW_RESULTS_MESSAGE =
  "Encontramos pocas oportunidades para tu perfil. Si revisas tus datos, por ejemplo tu disponibilidad o tus intereses, podrían aparecer más opciones.";

/** GET /api/recommendations: entre 4 y 5 oportunidades para el perfil guardado. */
export function recommendationRoutes(deps: AppDependencies) {
  const app = new Hono<AppEnv>();
  app.use("*", requireUser(deps.auth));

  app.get("/", async (c) => {
    const stored = await deps.repository.getProfile(c.get("user").id);
    const profile = toCompleteProfile(stored);
    if (!profile) {
      return c.json(
        errorBody(
          "profile_incomplete",
          "Completa tu perfil para ver recomendaciones.",
          { missingFields: findMissingFields(stored) },
        ),
        409,
      );
    }

    const opportunities = await deps.repository.listActiveOpportunities();
    const result = recommend(profile, opportunities, deps.now());

    return c.json({
      items: result.items.map(({ opportunity: o, validity, reasons }) => ({
        id: o.id,
        title: o.title,
        summaryPlain: o.summaryPlain,
        category: o.category,
        entityName: o.entityName,
        modality: o.modality,
        deadline: o.deadline,
        validity,
        reasons,
      })),
      insufficient: result.insufficient,
      message: result.items.length === 0
        ? NO_RESULTS_MESSAGE
        : result.insufficient
        ? FEW_RESULTS_MESSAGE
        : null,
    });
  });

  return app;
}
