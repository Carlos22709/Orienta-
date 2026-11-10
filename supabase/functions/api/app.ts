import { Hono } from "hono";
import { healthRoutes } from "./routes/health.ts";

/**
 * Crea la aplicación HTTP de Orienta+.
 *
 * Supabase sirve la función en /functions/v1/api y le entrega la ruta desde
 * /api, por eso todas las rutas cuelgan de basePath("/api").
 * Se expone como función (y no como instancia global) para que cada prueba
 * trabaje con una aplicación limpia.
 */
export function createApp() {
  const app = new Hono().basePath("/api");

  app.route("/health", healthRoutes);

  app.notFound((c) =>
    c.json(
      { error: "not_found", message: "La ruta solicitada no existe." },
      404,
    )
  );

  app.onError((err, c) => {
    // El detalle queda en los registros del servidor, nunca en la respuesta.
    console.error(err);
    return c.json(
      {
        error: "internal_error",
        message: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
      },
      500,
    );
  });

  return app;
}
