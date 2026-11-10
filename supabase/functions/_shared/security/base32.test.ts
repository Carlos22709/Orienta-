import { assertEquals, assertThrows } from "@std/assert";
import { decodeBase32, encodeBase32 } from "./base32.ts";

const text = (value: string) => new TextEncoder().encode(value);

// Vectores de prueba de RFC 4648, sección 10.
const RFC_4648_VECTORS: Array<[string, string]> = [
  ["", ""],
  ["f", "MY======"],
  ["fo", "MZXQ===="],
  ["foo", "MZXW6==="],
  ["foob", "MZXW6YQ="],
  ["fooba", "MZXW6YTB"],
  ["foobar", "MZXW6YTBOI======"],
];

Deno.test("encodeBase32 cumple los vectores de RFC 4648 (sin relleno)", () => {
  for (const [plain, encoded] of RFC_4648_VECTORS) {
    assertEquals(encodeBase32(text(plain)), encoded.replace(/=+$/, ""));
  }
});

Deno.test("decodeBase32 cumple los vectores de RFC 4648 con y sin relleno", () => {
  for (const [plain, encoded] of RFC_4648_VECTORS) {
    assertEquals(decodeBase32(encoded), text(plain));
    assertEquals(decodeBase32(encoded.replace(/=+$/, "")), text(plain));
  }
});

Deno.test("decodeBase32 tolera minúsculas y espacios de una semilla pegada", () => {
  assertEquals(decodeBase32("mzxw 6ytb oi"), text("foobar"));
});

Deno.test("decodeBase32 rechaza caracteres fuera del alfabeto", () => {
  assertThrows(() => decodeBase32("MZXW1"), RangeError);
  assertThrows(() => decodeBase32("MZXW8"), RangeError);
});

Deno.test("encodeBase32 y decodeBase32 son inversas para 20 bytes aleatorios", () => {
  const secret = crypto.getRandomValues(new Uint8Array(20));
  assertEquals(decodeBase32(encodeBase32(secret)), secret);
});
