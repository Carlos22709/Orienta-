import { assert, assertEquals, assertMatch } from "@std/assert";
import { decodeBase32 } from "../../_shared/security/base32.ts";
import { generateTotp } from "../../_shared/security/totp.ts";
import {
  AUTH_HEADER,
  createTestApp,
  TEST_USER,
  TestClock,
} from "../testing/fakes.ts";

type App = ReturnType<typeof createTestApp>["app"];

function post(app: App, path: string, body: unknown = {}) {
  return app.request(path, {
    method: "POST",
    headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("POST /api/mfa/enroll entrega el URI otpauth y la semilla para escribirla a mano", async () => {
  const { app, repository } = createTestApp();

  const res = await post(app, "/api/mfa/enroll");
  const body = await res.json();

  assertEquals(res.status, 201);
  assertMatch(
    body.otpauthUri,
    /^otpauth:\/\/totp\/Orienta%2B:prueba%40example\.com\?secret=[A-Z2-7]+&issuer=Orienta%2B/,
  );
  assertMatch(body.secret, /^[A-Z2-7]{32}$/); // 20 bytes en Base32
  // El secreto se guarda cifrado y sin confirmar.
  const factor = repository.mfaFactors.get(TEST_USER.id)!;
  assertEquals(factor.confirmedAt, null);
  assert(
    !new TextDecoder().decode(factor.secretCiphertext).includes(body.secret),
  );
});

Deno.test("el factor se activa solo después de confirmar un código válido", async () => {
  const clock = new TestClock();
  const { app } = createTestApp({ now: clock.now });
  const { secret } = await (await post(app, "/api/mfa/enroll")).json();

  const status = async () =>
    (await (await app.request("/api/mfa/status", { headers: AUTH_HEADER }))
      .json()).enrolled;
  assertEquals(await status(), false);

  const wrong = await post(app, "/api/mfa/enroll/confirm", { code: "000000" });
  assertEquals(wrong.status, 422);
  assertEquals((await wrong.json()).error, "invalid_code");

  const code = await generateTotp(decodeBase32(secret), clock.unixSeconds());
  const ok = await post(app, "/api/mfa/enroll/confirm", { code });
  assertEquals(ok.status, 200);
  assertEquals(await status(), true);
});

Deno.test("no se puede inscribir de nuevo un factor ya activo ni confirmar sin inscripción", async () => {
  const clock = new TestClock();
  const { app } = createTestApp({ now: clock.now });

  const withoutEnrollment = await post(app, "/api/mfa/enroll/confirm", {
    code: "123456",
  });
  assertEquals(withoutEnrollment.status, 409);
  assertEquals((await withoutEnrollment.json()).error, "mfa_not_pending");

  const { secret } = await (await post(app, "/api/mfa/enroll")).json();
  const code = await generateTotp(decodeBase32(secret), clock.unixSeconds());
  await post(app, "/api/mfa/enroll/confirm", { code });

  const again = await post(app, "/api/mfa/enroll");
  assertEquals(again.status, 409);
  assertEquals((await again.json()).error, "mfa_already_enrolled");
});

Deno.test("las rutas de MFA exigen sesión", async () => {
  const { app } = createTestApp();

  const res = await app.request("/api/mfa/enroll", { method: "POST" });

  assertEquals(res.status, 401);
});
