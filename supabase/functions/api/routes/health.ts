import { Hono } from "hono";

/** GET /api/health: permite comprobar que la API responde (público). */
export const healthRoutes = new Hono().get(
  "/",
  (c) => c.json({ status: "ok", service: "orienta-api" }),
);
