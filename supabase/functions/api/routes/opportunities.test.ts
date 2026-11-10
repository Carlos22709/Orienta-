import { assertEquals } from "@std/assert";
import {
  AUTH_HEADER,
  createTestApp,
  makeOpportunityRecord,
  TEST_USER,
} from "../testing/fakes.ts";

Deno.test("GET /api/opportunities/:id devuelve el detalle y registra la vista", async () => {
  const { app, repository } = createTestApp();
  const opportunity = makeOpportunityRecord({ deadline: "2026-11-12" });
  repository.opportunities = [opportunity];

  const res = await app.request(`/api/opportunities/${opportunity.id}`, {
    headers: AUTH_HEADER,
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.id, opportunity.id);
  assertEquals(body.officialUrl, "https://example.com/inscripcion");
  assertEquals(body.sourceUrl, "https://example.com/convocatoria");
  assertEquals(body.requirements, ["Tener entre 18 y 28 años."]);
  assertEquals(body.verifiedBy, "Equipo de prueba");
  assertEquals(body.validity, { kind: "closing_soon", daysLeft: 3 });
  assertEquals(repository.views, [
    { userId: TEST_USER.id, opportunityId: opportunity.id },
  ]);
});

Deno.test("una oportunidad vencida o retirada se muestra como cerrada", async () => {
  const { app, repository } = createTestApp();
  const expired = makeOpportunityRecord({ deadline: "2026-10-01" });
  const withdrawn = makeOpportunityRecord({ status: "withdrawn" });
  repository.opportunities = [expired, withdrawn];

  for (const opportunity of [expired, withdrawn]) {
    const body = await (await app.request(
      `/api/opportunities/${opportunity.id}`,
      { headers: AUTH_HEADER },
    )).json();
    assertEquals(body.validity, { kind: "closed" });
  }
});

Deno.test("una oportunidad inexistente responde 404", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/opportunities/no-existe", {
    headers: AUTH_HEADER,
  });

  assertEquals(res.status, 404);
  assertEquals((await res.json()).error, "not_found");
});

Deno.test("el detalle exige sesión", async () => {
  const { app, repository } = createTestApp();
  const opportunity = makeOpportunityRecord();
  repository.opportunities = [opportunity];

  const res = await app.request(`/api/opportunities/${opportunity.id}`);

  assertEquals(res.status, 401);
});
