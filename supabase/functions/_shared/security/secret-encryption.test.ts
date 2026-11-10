import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { encodeBase64 } from "@std/encoding/base64";
import {
  decryptSecret,
  encryptSecret,
  importEncryptionKey,
} from "./secret-encryption.ts";

const keyBase64 = () =>
  encodeBase64(crypto.getRandomValues(new Uint8Array(32)));
const secret = new TextEncoder().encode("12345678901234567890");

Deno.test("cifrar y descifrar devuelve el secreto original", async () => {
  const key = await importEncryptionKey(keyBase64());
  const encrypted = await encryptSecret(key, secret);
  assertEquals(await decryptSecret(key, encrypted), secret);
});

Deno.test("cada cifrado usa un IV distinto de 12 bytes", async () => {
  const key = await importEncryptionKey(keyBase64());
  const a = await encryptSecret(key, secret);
  const b = await encryptSecret(key, secret);
  assertEquals(a.iv.length, 12);
  assertNotEquals(a.iv, b.iv);
  assertNotEquals(a.ciphertext, b.ciphertext);
});

Deno.test("un texto cifrado alterado se rechaza (autenticación de AES-GCM)", async () => {
  const key = await importEncryptionKey(keyBase64());
  const encrypted = await encryptSecret(key, secret);
  const tampered = encrypted.ciphertext.slice();
  tampered[0] ^= 0xff;
  await assertRejects(() =>
    decryptSecret(key, { iv: encrypted.iv, ciphertext: tampered })
  );
});

Deno.test("descifrar con otra clave falla", async () => {
  const encrypted = await encryptSecret(
    await importEncryptionKey(keyBase64()),
    secret,
  );
  await assertRejects(async () =>
    decryptSecret(await importEncryptionKey(keyBase64()), encrypted)
  );
});

Deno.test("la clave debe ser de exactamente 32 bytes en Base64", async () => {
  await assertRejects(
    () => importEncryptionKey(encodeBase64(new Uint8Array(16))),
    RangeError,
  );
});
