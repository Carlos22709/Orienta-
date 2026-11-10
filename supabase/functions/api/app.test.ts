import { assertEquals } from "@std/assert";
import { createTestApp } from "./testing/fakes.ts";

Deno.test("GET /api/health responde 200 con el estado del servicio", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/health");

  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  assertEquals(await res.json(), { status: "ok", service: "orienta-api" });
});

Deno.test("una ruta inexistente responde 404 con el formato de error acordado", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/no-existe");

  assertEquals(res.status, 404);
  assertEquals(await res.json(), {
    error: "not_found",
    message: "La ruta solicitada no existe.",
  });
});

Deno.test("un error no controlado responde 500 sin exponer detalles internos", async () => {
  const { app } = createTestApp();
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

Deno.test("las rutas protegidas responden 401 sin token o con un token inválido", async () => {
  const { app } = createTestApp();

  const attempts: Array<Record<string, string>> = [
    {},
    { Authorization: "token-valido" },
    { Authorization: "Bearer token-falso" },
  ];
  for (const headers of attempts) {
    const res = await app.request("/api/me/profile", { headers });
    assertEquals(res.status, 401);
    assertEquals((await res.json()).error, "unauthorized");
  }
});
