import { Hono } from "hono";
import type { AppDependencies } from "../deps.ts";
import { type AppEnv, requireUser } from "../middleware/auth.ts";
import { requireElevation } from "../middleware/elevation.ts";

/**
 * Acciones críticas sobre los propios datos (derechos de la Ley 1581 de
 * 2012). Ambas exigen sesión y step-up con 2FA (decisión 0002).
 *
 * Los middlewares se aplican por ruta y no con use("*"), porque este grupo
 * se monta en /me y no debe afectar a /me/profile.
 */
export function accountRoutes(deps: AppDependencies) {
  const app = new Hono<AppEnv>();

  // GET /api/me/data-export: todo lo que Orienta+ guarda de la persona.
  app.get(
    "/data-export",
    requireUser(deps.auth),
    requireElevation(deps, "data_export"),
    async (c) => {
      const user = c.get("user");
      const [profile, opportunityViews, factor] = await Promise.all([
        deps.repository.getProfile(user.id),
        deps.repository.listOpportunityViews(user.id),
        deps.repository.getMfaFactor(user.id),
      ]);
      return c.json({
        exportedAt: deps.now().toISOString(),
        account: { id: user.id, email: user.email },
        profile,
        opportunityViews,
        // Nunca se exporta el secreto TOTP, solo si el 2FA está activo.
        twoFactor: {
          enrolled: Boolean(factor?.confirmedAt),
          confirmedAt: factor?.confirmedAt ?? null,
        },
      });
    },
  );

  // DELETE /api/me: elimina la cuenta; las tablas propias se borran en cascada.
  app.delete(
    "/",
    requireUser(deps.auth),
    requireElevation(deps, "account_deletion"),
    async (c) => {
      await deps.repository.deleteUser(c.get("user").id);
      return c.body(null, 204);
    },
  );

  return app;
}
