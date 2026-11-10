import {
  assert,
  assertEquals,
  assertMatch,
  assertNotEquals,
} from "@std/assert";
import { createStepUpToken, hashStepUpToken } from "./step-up-token.ts";

Deno.test("createStepUpToken genera un token URL-safe y su hash SHA-256", async () => {
  const { token, hash } = await createStepUpToken();

  assertMatch(token, /^[A-Za-z0-9_-]{43}$/); // 32 bytes en Base64URL sin relleno
  assertMatch(hash, /^[0-9a-f]{64}$/);
  assertEquals(await hashStepUpToken(token), hash);
});

Deno.test("cada token es distinto y el hash nunca es igual al token", async () => {
  const a = await createStepUpToken();
  const b = await createStepUpToken();

  assertNotEquals(a.token, b.token);
  assertNotEquals(a.hash, b.hash);
  assert(a.hash !== a.token);
});
