import { assertEquals } from "@std/assert";
import { findUnmetCriteria } from "./eligibility.ts";
import {
  BOGOTA,
  CHIA,
  makeOpportunity,
  TEST_PROFILES,
  TODAY,
} from "./testing/fixtures.ts";
import type { Profile } from "./types.ts";

// P2: 22 años, Bogotá, universitario incompleto, menos de 1 año, medio tiempo.
const profile: Profile = TEST_PROFILES.P2;

Deno.test("una oportunidad sin restricciones es elegible", () => {
  assertEquals(findUnmetCriteria(profile, makeOpportunity(), TODAY), []);
});

Deno.test("la edad se valida con bordes inclusivos", () => {
  const unmet = (minAge: number | null, maxAge: number | null) =>
    findUnmetCriteria(profile, makeOpportunity({ minAge, maxAge }), TODAY);

  assertEquals(unmet(22, 28), []);
  assertEquals(unmet(18, 22), []);
  assertEquals(unmet(23, 28), ["age"]);
  assertEquals(unmet(18, 21), ["age"]);
  assertEquals(unmet(null, 21), ["age"]);
});

Deno.test("la ubicación acepta convocatorias nacionales y las del municipio del perfil", () => {
  const unmet = (municipalityCodes: string[] | null) =>
    findUnmetCriteria(
      profile,
      makeOpportunity({ municipalityCodes }),
      TODAY,
    );

  assertEquals(unmet(null), []);
  assertEquals(unmet([CHIA, BOGOTA]), []);
  assertEquals(unmet([CHIA]), ["location"]);
});

Deno.test("la educación y la experiencia deben alcanzar el mínimo exigido", () => {
  const check = (overrides: Parameters<typeof makeOpportunity>[0]) =>
    findUnmetCriteria(profile, makeOpportunity(overrides), TODAY);

  assertEquals(check({ minEducation: "university_incomplete" }), []);
  assertEquals(check({ minEducation: "secondary" }), []);
  assertEquals(check({ minEducation: "university" }), ["education"]);
  assertEquals(check({ minExperience: "lt_1y" }), []);
  assertEquals(check({ minExperience: "none" }), []);
  assertEquals(check({ minExperience: "1_3y" }), ["experience"]);
});

Deno.test("la disponibilidad debe coincidir salvo que el perfil o la oportunidad sean flexibles", () => {
  const check = (p: Profile, availability: Profile["availability"][] | null) =>
    findUnmetCriteria(p, makeOpportunity({ availability }), TODAY);

  assertEquals(check(profile, null), []);
  assertEquals(check(profile, ["part_time", "weekends"]), []);
  assertEquals(check(profile, ["full_time"]), ["availability"]);
  assertEquals(
    check({ ...profile, availability: "flexible" }, ["full_time"]),
    [],
  );
});

Deno.test("una oportunidad flexible sirve para cualquier disponibilidad del perfil", () => {
  const check = (p: Profile, availability: Profile["availability"][] | null) =>
    findUnmetCriteria(p, makeOpportunity({ availability }), TODAY);

  // Caso real del perfil de prueba P3 (solo fines de semana, decisión 0007).
  const weekendsOnly: Profile = { ...profile, availability: "weekends" };
  assertEquals(check(weekendsOnly, ["flexible"]), []);
  assertEquals(check(weekendsOnly, ["flexible", "part_time"]), []);
  assertEquals(
    check({ ...profile, availability: "full_time" }, ["flexible"]),
    [],
  );
  // Sin "flexible" en la oportunidad, la regla sigue exigiendo coincidencia.
  assertEquals(check(weekendsOnly, ["part_time", "full_time"]), [
    "availability",
  ]);
});

Deno.test("se informan todos los criterios incumplidos", () => {
  const opportunity = makeOpportunity({
    minAge: 25,
    municipalityCodes: [CHIA],
    minEducation: "postgraduate",
    minExperience: "gt_3y",
    availability: ["full_time"],
  });
  assertEquals(findUnmetCriteria(profile, opportunity, TODAY), [
    "age",
    "location",
    "education",
    "experience",
    "availability",
  ]);
});
