import { Hono } from "hono";
import type { AppDependencies } from "./deps.ts";
import { errorBody } from "./http/errors.ts";
import { accountRoutes } from "./routes/account.ts";
import { catalogRoutes } from "./routes/catalog.ts";
import { mfaRoutes } from "./routes/mfa.ts";
import { healthRoutes } from "./routes/health.ts";
import { opportunityRoutes } from "./routes/opportunities.ts";
import { profileRoutes } from "./routes/profile.ts";
import { recommendationRoutes } from "./routes/recommendations.ts";

/**
 * Crea la aplicación HTTP de Orienta+.
 *
 * Supabase sirve la función en /functions/v1/api y le entrega la ruta desde
 * /api, por eso todas las rutas cuelgan de basePath("/api"). Las
 * dependencias se reciben como parámetro para poder probar con dobles en
 * memoria (api/testing/fakes.ts).
 */
export function createApp(deps: AppDependencies) {
  const app = new Hono().basePath("/api");

  app.route("/health", healthRoutes);
  app.route("/catalog", catalogRoutes(deps));
  app.route("/me/profile", profileRoutes(deps));
  app.route("/recommendations", recommendationRoutes(deps));
  app.route("/opportunities", opportunityRoutes(deps));
  app.route("/mfa", mfaRoutes(deps));
  app.route("/me", accountRoutes(deps));

  app.notFound((c) =>
    c.json(errorBody("not_found", "La ruta solicitada no existe."), 404)
  );

  app.onError((err, c) => {
    // El detalle queda en los registros del servidor, nunca en la respuesta.
    console.error(err);
    return c.json(
      errorBody(
        "internal_error",
        "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
      ),
      500,
    );
  });

  return app;
}
