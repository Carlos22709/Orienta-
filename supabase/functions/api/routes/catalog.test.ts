import { assertEquals } from "@std/assert";
import { createTestApp, TEST_MUNICIPALITIES } from "../testing/fakes.ts";

Deno.test("GET /api/catalog es público y devuelve las opciones del perfil", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/catalog");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.municipalities, TEST_MUNICIPALITIES);
  assertEquals(body.categories[0], { value: "employment", label: "Empleo" });
  // Los niveles se entregan en orden de menor a mayor.
  assertEquals(
    body.educationLevels.map((o: { value: string }) => o.value),
    [
      "secondary_incomplete",
      "secondary",
      "technical",
      "technologist",
      "university_incomplete",
      "university",
      "postgraduate",
    ],
  );
  assertEquals(body.experienceLevels.length, 4);
  assertEquals(body.situations.length, 4);
  assertEquals(body.availabilities.length, 4);
  assertEquals(body.consentVersion, "2026-11-09");
});
