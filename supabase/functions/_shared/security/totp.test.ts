import { assert, assertEquals, assertNotEquals } from "@std/assert";
import {
  buildOtpauthUri,
  generateHotp,
  generateSecret,
  generateTotp,
  timeStep,
  verifyTotp,
} from "./totp.ts";

// Secreto de los apéndices de RFC 4226 y RFC 6238 (SHA-1): "12345678901234567890".
const RFC_SECRET = new TextEncoder().encode("12345678901234567890");

Deno.test("generateHotp cumple los vectores de RFC 4226 (apéndice D)", async () => {
  const expected = [
    "755224",
    "287082",
    "359152",
    "969429",
    "338314",
    "254676",
    "287922",
    "162583",
    "399871",
    "520489",
  ];
  for (let counter = 0; counter < expected.length; counter++) {
    assertEquals(await generateHotp(RFC_SECRET, counter), expected[counter]);
  }
});

Deno.test("generateTotp cumple los vectores SHA-1 de RFC 6238 (apéndice B, 8 dígitos)", async () => {
  const vectors: Array<[number, string]> = [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ];
  for (const [unixSeconds, code] of vectors) {
    assertEquals(await generateTotp(RFC_SECRET, unixSeconds, 8), code);
  }
});

Deno.test("con 6 dígitos el código conserva los ceros a la izquierda", async () => {
  // 07081804 → últimos 6 dígitos: 081804.
  assertEquals(await generateTotp(RFC_SECRET, 1111111109), "081804");
});

Deno.test("timeStep divide el tiempo Unix en ventanas de 30 segundos", () => {
  assertEquals(timeStep(0), 0);
  assertEquals(timeStep(29), 0);
  assertEquals(timeStep(30), 1);
  assertEquals(timeStep(1111111109), 37037036);
});

Deno.test("verifyTotp acepta las ventanas C-1, C y C+1 y devuelve la ventana usada", async () => {
  const now = 1_800_000_015; // ventana C = 60000000
  const C = timeStep(now);
  for (const offset of [-1, 0, 1]) {
    const code = await generateTotp(RFC_SECRET, now + offset * 30);
    assertEquals(
      await verifyTotp({ secret: RFC_SECRET, code, unixSeconds: now }),
      { ok: true, step: C + offset },
    );
  }
});

Deno.test("verifyTotp rechaza códigos fuera de la tolerancia de una ventana", async () => {
  const now = 1_800_000_015;
  for (const offset of [-2, 2]) {
    const code = await generateTotp(RFC_SECRET, now + offset * 30);
    assertEquals(
      await verifyTotp({ secret: RFC_SECRET, code, unixSeconds: now }),
      { ok: false, reason: "invalid_code" },
    );
  }
});

Deno.test("verifyTotp detecta la repetición de un código ya usado (anti-replay)", async () => {
  const now = 1_800_000_015;
  const code = await generateTotp(RFC_SECRET, now);
  const first = await verifyTotp({
    secret: RFC_SECRET,
    code,
    unixSeconds: now,
  });
  assert(first.ok);

  const replay = await verifyTotp({
    secret: RFC_SECRET,
    code,
    unixSeconds: now + 5,
    lastUsedStep: first.step,
  });
  assertEquals(replay, { ok: false, reason: "replayed" });
});

Deno.test("verifyTotp no acepta un código de una ventana anterior a la última usada", async () => {
  const now = 1_800_000_015;
  const previousWindowCode = await generateTotp(RFC_SECRET, now - 30);
  assertEquals(
    await verifyTotp({
      secret: RFC_SECRET,
      code: previousWindowCode,
      unixSeconds: now,
      lastUsedStep: timeStep(now),
    }),
    { ok: false, reason: "replayed" },
  );
});

Deno.test("verifyTotp acepta un código pegado con espacios y rechaza formatos inválidos", async () => {
  const now = 1_800_000_015;
  const code = await generateTotp(RFC_SECRET, now);
  const pasted = `${code.slice(0, 3)} ${code.slice(3)}`;
  assertEquals(
    await verifyTotp({ secret: RFC_SECRET, code: pasted, unixSeconds: now }),
    { ok: true, step: timeStep(now) },
  );
  for (const invalid of ["", "12345", "1234567", "12a456"]) {
    assertEquals(
      await verifyTotp({ secret: RFC_SECRET, code: invalid, unixSeconds: now }),
      { ok: false, reason: "invalid_format" },
    );
  }
});

Deno.test("generateSecret produce 20 bytes aleatorios", () => {
  const a = generateSecret();
  const b = generateSecret();
  assertEquals(a.length, 20);
  assertNotEquals(a, b);
});

Deno.test("buildOtpauthUri arma el URI que leen las apps autenticadoras", () => {
  const uri = buildOtpauthUri({
    secret: new TextEncoder().encode("foobar"),
    accountName: "persona@example.com",
    issuer: "Orienta+",
  });
  assertEquals(
    uri,
    "otpauth://totp/Orienta%2B:persona%40example.com" +
      "?secret=MZXW6YTBOI&issuer=Orienta%2B&algorithm=SHA1&digits=6&period=30",
  );
});
