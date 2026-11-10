import { assertEquals } from "@std/assert";
import {
  ELEVATED_TOKEN_TTL_SECONDS,
  signElevatedToken,
  verifyElevatedToken,
} from "./elevated-token.ts";

const SECRET = "secreto-de-prueba-de-al-menos-32-caracteres!!";
const USER = "00000000-0000-0000-0000-000000000001";
const NOW = new Date("2026-11-10T15:00:00Z");
const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

Deno.test("un token elevado recién firmado es válido para su usuario", async () => {
  const { token, expiresAt } = await signElevatedToken(SECRET, USER, NOW);

  assertEquals(
    expiresAt,
    new Date(NOW.getTime() + ELEVATED_TOKEN_TTL_SECONDS * 1000).toISOString(),
  );
  assertEquals(await verifyElevatedToken(SECRET, token, USER, NOW), true);
});

Deno.test("el token elevado dura 10 minutos", async () => {
  const { token } = await signElevatedToken(SECRET, USER, NOW);
  const at = (offsetSeconds: number) =>
    new Date((seconds(NOW) + offsetSeconds) * 1000);

  assertEquals(ELEVATED_TOKEN_TTL_SECONDS, 600);
  assertEquals(await verifyElevatedToken(SECRET, token, USER, at(599)), true);
  assertEquals(await verifyElevatedToken(SECRET, token, USER, at(601)), false);
});

Deno.test("un token elevado no sirve para otro usuario", async () => {
  const { token } = await signElevatedToken(SECRET, USER, NOW);
  const other = "00000000-0000-0000-0000-000000000002";

  assertEquals(await verifyElevatedToken(SECRET, token, other, NOW), false);
});

Deno.test("un token firmado con otro secreto o alterado se rechaza", async () => {
  const { token } = await signElevatedToken(SECRET, USER, NOW);
  const otherSecret = "otro-secreto-distinto-de-al-menos-32-caracteres";

  assertEquals(await verifyElevatedToken(otherSecret, token, USER, NOW), false);
  assertEquals(
    await verifyElevatedToken(SECRET, token.slice(0, -2) + "xx", USER, NOW),
    false,
  );
  assertEquals(
    await verifyElevatedToken(SECRET, "no-es-un-jwt", USER, NOW),
    false,
  );
});
