import { assert, assertEquals } from "@std/assert";
import { recommend } from "./recommendation.ts";
import {
  CHIA,
  makeOpportunity,
  NOW,
  TEST_PROFILES,
} from "./testing/fixtures.ts";
import type { Category, OpportunityForRanking, Profile } from "./types.ts";

// P1: 19 años, Chía, no estudia ni trabaja, interesado en formación y subsidios.
const P1: Profile = TEST_PROFILES.P1;

const ids = (result: ReturnType<typeof recommend>) =>
  result.items.map((item) => item.opportunity.id);

function manyOf(category: Category, count: number): OpportunityForRanking[] {
  return Array.from({ length: count }, () => makeOpportunity({ category }));
}

Deno.test("nunca recomienda oportunidades cerradas ni no elegibles", () => {
  const closed = makeOpportunity({ deadline: "2026-11-08" });
  const tooOld = makeOpportunity({ maxAge: 18 });
  const valid = makeOpportunity();

  const result = recommend(P1, [closed, tooOld, valid], NOW);

  assertEquals(ids(result), [valid.id]);
});

Deno.test("devuelve como máximo 5 recomendaciones", () => {
  const catalog = [
    ...manyOf("training", 3),
    ...manyOf("subsidy", 3),
    ...manyOf("entrepreneurship", 3),
    ...manyOf("employment", 3),
  ];

  const result = recommend(P1, catalog, NOW);

  assertEquals(result.items.length, 5);
  assertEquals(result.insufficient, false);
});

Deno.test("limita a 2 por categoría cuando hay suficientes categorías distintas", () => {
  const catalog = [
    ...manyOf("training", 4),
    ...manyOf("subsidy", 4),
    ...manyOf("employment", 4),
  ];

  const result = recommend(P1, catalog, NOW);
  const perCategory = new Map<Category, number>();
  for (const item of result.items) {
    const category = item.opportunity.category;
    perCategory.set(category, (perCategory.get(category) ?? 0) + 1);
  }

  assertEquals(result.items.length, 5);
  for (const count of perCategory.values()) assert(count <= 2);
});

Deno.test("completa sin el límite por categoría cuando no hay otras categorías", () => {
  const result = recommend(P1, manyOf("training", 6), NOW);

  assertEquals(result.items.length, 5);
  assertEquals(result.insufficient, false);
});

Deno.test("marca la respuesta como insuficiente con 1 a 3 elegibles", () => {
  const result = recommend(P1, manyOf("training", 3), NOW);

  assertEquals(result.items.length, 3);
  assertEquals(result.insufficient, true);
});

Deno.test("sin elegibles devuelve una lista vacía e insuficiente", () => {
  const result = recommend(P1, [makeOpportunity({ minAge: 25 })], NOW);

  assertEquals(result, { items: [], insufficient: true });
});

Deno.test("prioriza intereses y rutas prioritarias de la situación actual", () => {
  // P1 (neither): training es interés (+3) y ruta prioritaria (+2) = 5.
  // subsidy: interés (+3) y ruta (+2) = 5. entrepreneurship: solo ruta = 2.
  // employment: nada = 0.
  const employment = makeOpportunity({ category: "employment" });
  const entrepreneurship = makeOpportunity({ category: "entrepreneurship" });
  const training = makeOpportunity({ category: "training" });

  const result = recommend(P1, [employment, entrepreneurship, training], NOW);

  assertEquals(ids(result), [training.id, entrepreneurship.id, employment.id]);
  assertEquals(result.items.map((item) => item.score), [5, 2, 0]);
});

Deno.test("suma puntos por ser local y por estar por cerrar", () => {
  const nationalOpen = makeOpportunity({ category: "employment" });
  const localOpen = makeOpportunity({
    category: "employment",
    municipalityCodes: [CHIA],
  });
  const nationalClosing = makeOpportunity({
    category: "employment",
    deadline: "2026-11-12",
  });

  const result = recommend(
    P1,
    [nationalOpen, localOpen, nationalClosing],
    NOW,
  );
  const scoreOf = (id: string) =>
    result.items.find((item) => item.opportunity.id === id)?.score;

  assertEquals(scoreOf(nationalOpen.id), 0);
  assertEquals(scoreOf(localOpen.id), 1);
  assertEquals(scoreOf(nationalClosing.id), 1);
});

Deno.test("desempata por fecha límite más cercana, luego verificación más reciente y luego id", () => {
  const later = makeOpportunity({ id: "a", deadline: "2026-12-20" });
  const sooner = makeOpportunity({ id: "b", deadline: "2026-12-10" });
  const openCall = makeOpportunity({
    id: "c",
    deadline: null,
    verifiedAt: "2026-11-08T12:00:00Z",
  });
  const olderVerification = makeOpportunity({
    id: "d",
    deadline: "2026-12-20",
    verifiedAt: "2026-10-20T12:00:00Z",
  });
  const sameAsLater = makeOpportunity({ id: "e", deadline: "2026-12-20" });

  const result = recommend(
    P1,
    [openCall, olderVerification, sameAsLater, later, sooner],
    NOW,
  );

  assertEquals(ids(result), ["b", "a", "e", "d", "c"]);
});

Deno.test("el resultado no depende del orden de entrada", () => {
  const catalog = [
    ...manyOf("training", 3),
    ...manyOf("subsidy", 2),
    ...manyOf("employment", 3),
  ];
  const reversed = [...catalog].reverse();

  assertEquals(
    ids(recommend(P1, catalog, NOW)),
    ids(recommend(P1, reversed, NOW)),
  );
});

Deno.test("explica cada recomendación con las reglas que se cumplieron", () => {
  const opportunity = makeOpportunity({
    category: "training",
    municipalityCodes: [CHIA],
    deadline: "2026-11-12",
  });

  const [item] = recommend(P1, [opportunity], NOW).items;

  assertEquals(item.validity, { kind: "closing_soon", daysLeft: 3 });
  assertEquals(item.reasons, [
    "Te interesa la formación.",
    "Es una buena ruta si hoy no estás estudiando ni trabajando.",
    "Es en tu municipio.",
  ]);
});

Deno.test("si ninguna regla de ranking aplica, explica que cumple los requisitos", () => {
  const [item] = recommend(
    P1,
    [makeOpportunity({ category: "employment" })],
    NOW,
  ).items;

  assertEquals(item.reasons, [
    "Cumples los requisitos de edad, ubicación, estudios, experiencia y horario.",
  ]);
});

Deno.test("anuncia el cierre próximo en lenguaje claro", () => {
  const reasonFor = (deadline: string) =>
    recommend(
      P1,
      [makeOpportunity({ category: "employment", deadline })],
      NOW,
    ).items[0].reasons;

  assertEquals(reasonFor("2026-11-09"), ["Cierra hoy."]);
  assertEquals(reasonFor("2026-11-10"), ["Cierra mañana."]);
  assertEquals(reasonFor("2026-11-14"), ["Cierra en 5 días."]);
});

Deno.test("cada perfil de prueba recibe solo oportunidades compatibles", () => {
  const catalog = [
    makeOpportunity({ category: "scholarship", minEducation: "university" }),
    makeOpportunity({ category: "employment", minExperience: "gt_3y" }),
    makeOpportunity({ category: "training", maxAge: 20 }),
    makeOpportunity({ category: "subsidy", availability: ["weekends"] }),
  ];

  for (const profile of Object.values(TEST_PROFILES)) {
    for (const item of recommend(profile, catalog, NOW).items) {
      assert(item.score >= 0);
      assert(item.reasons.length >= 1 && item.reasons.length <= 3);
    }
  }
  // P4 (universitario, más de 3 años, tiempo completo, 28 años) cumple las
  // dos primeras; no la de máximo 20 años ni la de fines de semana.
  assertEquals(
    recommend(TEST_PROFILES.P4, catalog, NOW).items.map((item) =>
      item.opportunity.category
    ).sort(),
    ["employment", "scholarship"],
  );
});
