import * as Crypto from 'expo-crypto';

/**
 * Funciones de PKCE (RFC 7636) para el inicio de sesión (decisión 0002).
 *
 * Se escriben a mano, sin librerías de OAuth, para que cada paso sea
 * explicable. Solo se delega en expo-crypto la generación de bytes
 * aleatorios y el SHA-256.
 */

export type RandomBytes = (count: number) => Uint8Array;
export type Sha256 = (input: string) => Promise<Uint8Array>;

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Base64URL sin relleno (RFC 4648, sección 5). */
export function base64UrlEncode(bytes: Uint8Array): string {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    // Junta hasta 3 bytes (24 bits) y los parte en 4 grupos de 6 bits.
    const chunk =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const remaining = bytes.length - i;
    output += ALPHABET[(chunk >> 18) & 63];
    output += ALPHABET[(chunk >> 12) & 63];
    if (remaining > 1) output += ALPHABET[(chunk >> 6) & 63];
    if (remaining > 2) output += ALPHABET[chunk & 63];
  }
  return output;
}

const secureRandomBytes: RandomBytes = (count) => Crypto.getRandomBytes(count);

const expoSha256: Sha256 = async (input) =>
  new Uint8Array(
    await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      new TextEncoder().encode(input),
    ),
  );

/** code_verifier: 32 bytes aleatorios en Base64URL (43 caracteres). */
export function createCodeVerifier(
  randomBytes: RandomBytes = secureRandomBytes,
): string {
  return base64UrlEncode(randomBytes(32));
}

/** code_challenge = BASE64URL(SHA-256(code_verifier)), método S256. */
export async function createCodeChallenge(
  verifier: string,
  sha256: Sha256 = expoSha256,
): Promise<string> {
  return base64UrlEncode(await sha256(verifier));
}

/** state: valor aleatorio por intento para detectar respuestas ajenas. */
export function createState(
  randomBytes: RandomBytes = secureRandomBytes,
): string {
  return base64UrlEncode(randomBytes(16));
}
