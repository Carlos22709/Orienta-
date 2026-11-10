import { assert, assertEquals } from "@std/assert";
import {
  AUTH_HEADER,
  COMPLETE_PROFILE,
  createTestApp,
  makeOpportunityRecord,
  TEST_USER,
} from "../testing/fakes.ts";

Deno.test("GET /api/recommendations con perfil incompleto responde 409 y lo que falta", async () => {
  const { app, repository } = createTestApp();
  repository.profiles.set(TEST_USER.id, {
    ...COMPLETE_PROFILE,
    availability: null,
  });

  const res = await app.request("/api/recommendations", {
    headers: AUTH_HEADER,
  });
  const body = await res.json();

  assertEquals(res.status, 409);
  assertEquals(body.error, "profile_incomplete");
  assertEquals(body.missingFields, ["availability"]);
});

Deno.test("GET /api/recommendations sin perfil responde 409 con todos los campos", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/recommendations", {
    headers: AUTH_HEADER,
  });

  assertEquals(res.status, 409);
  assertEquals((await res.json()).missingFields.length, 7);
});

Deno.test("GET /api/recommendations devuelve hasta 5 oportunidades vigentes con sus razones", async () => {
  const { app, repository } = createTestApp();
  repository.profiles.set(TEST_USER.id, COMPLETE_PROFILE);
  repository.opportunities = [
    ...Array.from(
      { length: 4 },
      () => makeOpportunityRecord({ category: "training" }),
    ),
    ...Array.from(
      { length: 4 },
      () => makeOpportunityRecord({ category: "subsidy" }),
    ),
    makeOpportunityRecord({ category: "employment" }),
    makeOpportunityRecord({ category: "training", deadline: "2026-11-01" }),
    makeOpportunityRecord({ category: "training", status: "withdrawn" }),
  ];

  const res = await app.request("/api/recommendations", {
    headers: AUTH_HEADER,
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.items.length, 5);
  assertEquals(body.insufficient, false);
  assertEquals(body.message, null);
  const first = body.items[0];
  assertEquals(Object.keys(first).sort(), [
    "category",
    "deadline",
    "entityName",
    "id",
    "modality",
    "reasons",
    "summaryPlain",
    "title",
    "validity",
  ]);
  assert(first.reasons.length >= 1);
  for (const item of body.items) assert(item.validity.kind !== "closed");
});

Deno.test("con pocas oportunidades explica la situación en lenguaje claro", async () => {
  const { app, repository } = createTestApp();
  repository.profiles.set(TEST_USER.id, COMPLETE_PROFILE);
  repository.opportunities = [makeOpportunityRecord()];

  const body = await (await app.request("/api/recommendations", {
    headers: AUTH_HEADER,
  })).json();

  assertEquals(body.items.length, 1);
  assertEquals(body.insufficient, true);
  assert(typeof body.message === "string" && body.message.length > 0);
});

Deno.test("sin oportunidades elegibles devuelve una lista vacía con mensaje", async () => {
  const { app, repository } = createTestApp();
  repository.profiles.set(TEST_USER.id, COMPLETE_PROFILE);

  const body = await (await app.request("/api/recommendations", {
    headers: AUTH_HEADER,
  })).json();

  assertEquals(body.items, []);
  assertEquals(body.insufficient, true);
  assert(typeof body.message === "string" && body.message.length > 0);
});
