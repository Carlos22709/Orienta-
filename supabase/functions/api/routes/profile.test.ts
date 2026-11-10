import { assert, assertEquals } from "@std/assert";
import {
  AUTH_HEADER,
  COMPLETE_PROFILE,
  createTestApp,
  TEST_USER,
} from "../testing/fakes.ts";

const ALL_FIELDS = [
  "birthDate",
  "municipalityCode",
  "educationLevel",
  "experienceLevel",
  "currentSituation",
  "interests",
  "availability",
];
const CONSENT = { version: "2026-11-09", accepted: true };

function put(app: ReturnType<typeof createTestApp>["app"], body: unknown) {
  return app.request("/api/me/profile", {
    method: "PUT",
    headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("GET /api/me/profile sin perfil devuelve null y todos los campos faltantes", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/me/profile", { headers: AUTH_HEADER });

  assertEquals(res.status, 200);
  assertEquals(await res.json(), { profile: null, missingFields: ALL_FIELDS });
});

Deno.test("PUT /api/me/profile exige consentimiento para crear el perfil", async () => {
  const { app, repository } = createTestApp();

  const res = await put(app, { birthDate: "2007-03-15" });

  assertEquals(res.status, 409);
  assertEquals((await res.json()).error, "consent_required");
  assertEquals(repository.profiles.size, 0);
});

Deno.test("PUT /api/me/profile guarda un paso y devuelve lo que falta para retomar", async () => {
  const { app, repository } = createTestApp();

  const res = await put(app, { consent: CONSENT, birthDate: "2007-03-15" });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.profile.birthDate, "2007-03-15");
  assertEquals(body.profile.consentVersion, "2026-11-09");
  assertEquals(body.missingFields, ALL_FIELDS.slice(1));
  assert(repository.profiles.has(TEST_USER.id));
});

Deno.test("los pasos siguientes no repiten el consentimiento y conservan lo guardado", async () => {
  const { app, repository } = createTestApp();
  await put(app, { consent: CONSENT, birthDate: "2007-03-15" });

  const res = await put(app, {
    municipalityCode: "25175",
    interests: ["training", "training", "subsidy"],
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.profile.birthDate, "2007-03-15");
  // Los intereses repetidos se guardan una sola vez.
  assertEquals(body.profile.interests, ["training", "subsidy"]);
  assertEquals(
    repository.profiles.get(TEST_USER.id)?.municipalityCode,
    "25175",
  );
});

Deno.test("un perfil completo no tiene campos faltantes", async () => {
  const { app, repository } = createTestApp();
  repository.profiles.set(TEST_USER.id, COMPLETE_PROFILE);

  const res = await app.request("/api/me/profile", { headers: AUTH_HEADER });

  assertEquals((await res.json()).missingFields, []);
});

Deno.test("PUT /api/me/profile valida cada campo y responde 422 con mensajes claros", async () => {
  const { app } = createTestApp();

  const cases: Array<[Record<string, unknown>, string]> = [
    [{ birthDate: "15/03/2007" }, "birthDate"],
    [{ birthDate: "2010-01-01" }, "birthDate"], // 16 años
    [{ birthDate: "1990-01-01" }, "birthDate"], // 36 años
    [{ municipalityCode: "05001" }, "municipalityCode"], // fuera de alcance
    [{ educationLevel: "doctorado" }, "educationLevel"],
    [{ interests: [] }, "interests"],
    [{ availability: "noches" }, "availability"],
    [{ campoDesconocido: true }, "campoDesconocido"],
  ];

  for (const [fields, invalidField] of cases) {
    const res = await put(app, { consent: CONSENT, ...fields });
    const body = await res.json();
    assertEquals(res.status, 422, `se esperaba 422 para ${invalidField}`);
    assertEquals(body.error, "validation_error");
    assert(
      typeof body.fields[invalidField] === "string",
      `falta el mensaje de ${invalidField}`,
    );
  }
});

Deno.test("PUT /api/me/profile rechaza un consentimiento de otra versión", async () => {
  const { app } = createTestApp();

  const res = await put(app, {
    consent: { version: "2020-01-01", accepted: true },
  });

  assertEquals(res.status, 422);
  assert(typeof (await res.json()).fields.consent === "string");
});

Deno.test("PUT /api/me/profile responde 400 si el cuerpo no es JSON", async () => {
  const { app } = createTestApp();

  const res = await put(app, "{no es json");

  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "invalid_json");
});
