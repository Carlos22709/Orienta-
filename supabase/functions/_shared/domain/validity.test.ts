import { assertEquals } from "@std/assert";
import { evaluateValidity } from "./validity.ts";
import { makeOpportunity, NOW } from "./testing/fixtures.ts";

Deno.test("una oportunidad cerrada o retirada nunca es vigente", () => {
  for (const status of ["closed", "withdrawn"] as const) {
    const opportunity = makeOpportunity({ status, deadline: "2026-12-31" });
    assertEquals(evaluateValidity(opportunity, NOW), { kind: "closed" });
  }
});

Deno.test("la fecha límite de hoy todavía es vigente y está por cerrar", () => {
  const opportunity = makeOpportunity({ deadline: "2026-11-09" });
  assertEquals(evaluateValidity(opportunity, NOW), {
    kind: "closing_soon",
    daysLeft: 0,
  });
});

Deno.test("una fecha límite de ayer ya no es vigente", () => {
  const opportunity = makeOpportunity({ deadline: "2026-11-08" });
  assertEquals(evaluateValidity(opportunity, NOW), { kind: "closed" });
});

Deno.test("faltando 7 días está por cerrar y faltando 8 está vigente", () => {
  assertEquals(
    evaluateValidity(makeOpportunity({ deadline: "2026-11-16" }), NOW),
    { kind: "closing_soon", daysLeft: 7 },
  );
  assertEquals(
    evaluateValidity(makeOpportunity({ deadline: "2026-11-17" }), NOW),
    { kind: "open" },
  );
});

Deno.test("la fecha límite se evalúa con el día de Bogotá, no el de UTC", () => {
  // 11:30 p. m. del 9 de noviembre en Bogotá; en UTC ya es 10 de noviembre.
  const lateNight = new Date("2026-11-10T04:30:00Z");
  const opportunity = makeOpportunity({ deadline: "2026-11-09" });
  assertEquals(evaluateValidity(opportunity, lateNight), {
    kind: "closing_soon",
    daysLeft: 0,
  });
});

Deno.test("una convocatoria abierta es vigente si se verificó hace 30 días o menos", () => {
  const verifiedExactly30DaysAgo = new Date(
    NOW.getTime() - 30 * 86_400_000,
  ).toISOString();
  const opportunity = makeOpportunity({
    deadline: null,
    verifiedAt: verifiedExactly30DaysAgo,
  });
  assertEquals(evaluateValidity(opportunity, NOW), { kind: "open" });
});

Deno.test("una convocatoria abierta deja de ser vigente pasados 30 días de su verificación", () => {
  const verifiedJustOver30DaysAgo = new Date(
    NOW.getTime() - 30 * 86_400_000 - 1,
  ).toISOString();
  const opportunity = makeOpportunity({
    deadline: null,
    verifiedAt: verifiedJustOver30DaysAgo,
  });
  assertEquals(evaluateValidity(opportunity, NOW), { kind: "closed" });
});
