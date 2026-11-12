import { Hono } from "hono";
import { evaluateValidity } from "../../_shared/domain/validity.ts";
import type { AppDependencies } from "../deps.ts";
import { errorBody } from "../http/errors.ts";
import { type AppEnv, requireUser } from "../middleware/auth.ts";

/**
 * Oportunidades guardadas con el ♡ (compromiso C3). Viven en el servidor
 * para que sigan a la persona al cerrar sesión o cambiar de teléfono; se
 * borran solo al eliminar la cuenta.
 *
 * GET    /api/me/saved      la lista, la más reciente primero.
 * PUT    /api/me/saved/:id  guarda una oportunidad (idempotente).
 * DELETE /api/me/saved/:id  la quita (idempotente).
 */
export function savedRoutes(deps: AppDependencies) {
  const app = new Hono<AppEnv>();
  app.use("*", requireUser(deps.auth));

  app.get("/", async (c) => {
    const now = deps.now();
    const saved = await deps.repository.listSavedOpportunities(
      c.get("user").id,
    );
    // Se incluyen las que ya cerraron, marcadas como cerradas: la persona
    // las guardó y decide si quitarlas.
    const items = saved.map(({ opportunity: o, savedAt }) => ({
      id: o.id,
      title: o.title,
      category: o.category,
      entityName: o.entityName,
      deadline: o.deadline,
      validity: evaluateValidity(o, now),
      savedAt,
    }));
    return c.json({ items });
  });

  app.put("/:id", async (c) => {
    const opportunity = await deps.repository.getOpportunity(c.req.param("id"));
    if (!opportunity) {
      return c.json(
        errorBody("not_found", "No encontramos esta oportunidad."),
        404,
      );
    }
    await deps.repository.saveOpportunity(c.get("user").id, opportunity.id);
    return c.body(null, 204);
  });

  app.delete("/:id", async (c) => {
    await deps.repository.unsaveOpportunity(
      c.get("user").id,
      c.req.param("id"),
    );
    return c.body(null, 204);
  });

  return app;
}
