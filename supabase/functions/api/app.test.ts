import { assertEquals } from "@std/assert";
import { createApp } from "./app.ts";

Deno.test("GET /api/health responde 200 con el estado del servicio", async () => {
  const app = createApp();

  const res = await app.request("/api/health");

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(await res.json(), { status: "ok", service: "orienta-api" });
});

Deno.test("una ruta inexistente responde 404 con el formato de error acordado", async () => {
  const app = createApp();

  const res = await app.request("/api/no-existe");

  assertEquals(res.status, 404);
  assertEquals(await res.json(), {
    error: "not_found",
    message: "La ruta solicitada no existe.",
  });
});

Deno.test("un error no controlado responde 500 sin exponer detalles internos", async () => {
  const app = createApp();
  // basePath("/api") ya antepone el prefijo: esta ruta queda en /api/falla.
  app.get("/falla", () => {
    throw new Error("detalle interno que no debe filtrarse");
  });

  const res = await app.request("/api/falla");

  assertEquals(res.status, 500);
  assertEquals(await res.json(), {
    error: "internal_error",
    message: "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
  });
});
