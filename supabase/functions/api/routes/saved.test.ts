import { assertEquals } from "@std/assert";
import {
  AUTH_HEADER,
  createTestApp,
  makeOpportunityRecord,
  OTHER_USER_TOKEN,
  TestClock,
} from "../testing/fakes.ts";

type App = ReturnType<typeof createTestApp>["app"];

function setup() {
  const clock = new TestClock();
  const { app, repository } = createTestApp({ now: clock.now });
  repository.opportunities = [
    makeOpportunityRecord({ id: "curso", deadline: "2026-12-31" }),
    makeOpportunityRecord({ id: "beca", deadline: "2026-12-31" }),
    makeOpportunityRecord({ id: "vencida", deadline: "2026-10-01" }),
  ];
  return { app, repository, clock };
}

function save(app: App, id: string, headers = AUTH_HEADER) {
  return app.request(`/api/me/saved/${id}`, { method: "PUT", headers });
}

async function savedIds(app: App, headers = AUTH_HEADER): Promise<string[]> {
  const res = await app.request("/api/me/saved", { headers });
  assertEquals(res.status, 200);
  const body = await res.json();
  return body.items.map((item: { id: string }) => item.id);
}

Deno.test("PUT /api/me/saved/:id guarda y GET la devuelve, la más reciente primero", async () => {
  const { app, clock } = setup();

  assertEquals((await save(app, "curso")).status, 204);
  clock.advanceSeconds(60);
  assertEquals((await save(app, "beca")).status, 204);

  assertEquals(await savedIds(app), ["beca", "curso"]);
});

Deno.test("GET /api/me/saved trae lo necesario para la lista y la vigencia", async () => {
  const { app } = setup();
  await save(app, "vencida");

  const body = await (await app.request("/api/me/saved", {
    headers: AUTH_HEADER,
  })).json();
  const [item] = body.items;

  assertEquals(body.items.length, 1);
  assertEquals(item.id, "vencida");
  assertEquals(item.title, "Oportunidad de prueba vencida");
  assertEquals(item.entityName, "Entidad de prueba");
  assertEquals(item.deadline, "2026-10-01");
  assertEquals(typeof item.category, "string");
  assertEquals(typeof item.savedAt, "string");
  // Una guardada que ya cerró se sigue mostrando, marcada como cerrada.
  assertEquals(item.validity, { kind: "closed" });
});

Deno.test("guardar dos veces no duplica ni cambia la fecha original", async () => {
  const { app, repository, clock } = setup();
  await save(app, "curso");
  const firstSavedAt = repository.saved[0].savedAt;

  clock.advanceSeconds(60);
  assertEquals((await save(app, "curso")).status, 204);

  assertEquals(repository.saved.length, 1);
  assertEquals(repository.saved[0].savedAt, firstSavedAt);
});

Deno.test("DELETE /api/me/saved/:id la quita y repetirlo no falla", async () => {
  const { app } = setup();
  await save(app, "curso");
  await save(app, "beca");

  const first = await app.request("/api/me/saved/curso", {
    method: "DELETE",
    headers: AUTH_HEADER,
  });
  const again = await app.request("/api/me/saved/curso", {
    method: "DELETE",
    headers: AUTH_HEADER,
  });

  assertEquals(first.status, 204);
  assertEquals(again.status, 204);
  assertEquals(await savedIds(app), ["beca"]);
});

Deno.test("guardar una oportunidad que no existe responde 404", async () => {
  const { app, repository } = setup();

  const res = await save(app, "no-existe");

  assertEquals(res.status, 404);
  assertEquals((await res.json()).error, "not_found");
  assertEquals(repository.saved, []);
});

Deno.test("cada persona ve y quita solo sus propias guardadas", async () => {
  const { app } = setup();
  const otherHeaders = { Authorization: `Bearer ${OTHER_USER_TOKEN}` };
  await save(app, "curso");
  await save(app, "beca", otherHeaders);

  // Quitar "curso" desde la otra cuenta no toca la lista de TEST_USER.
  await app.request("/api/me/saved/curso", {
    method: "DELETE",
    headers: otherHeaders,
  });

  assertEquals(await savedIds(app), ["curso"]);
  assertEquals(await savedIds(app, otherHeaders), ["beca"]);
});

Deno.test("las rutas de guardadas exigen sesión", async () => {
  const { app } = setup();

  const list = await app.request("/api/me/saved");
  const put = await app.request("/api/me/saved/curso", { method: "PUT" });
  const del = await app.request("/api/me/saved/curso", { method: "DELETE" });

  assertEquals([list.status, put.status, del.status], [401, 401, 401]);
});
