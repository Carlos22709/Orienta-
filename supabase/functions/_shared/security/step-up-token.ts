import { encodeBase64Url, encodeHex } from "@std/encoding";

/**
 * step_up_token (decisión 0002): valor aleatorio que la API entrega con el
 * 403 mfa_required y que la app devuelve junto con el código TOTP.
 * En la base de datos solo se guarda su hash SHA-256: si alguien lee la
 * tabla, no obtiene tokens utilizables.
 */

const TOKEN_BYTES = 32;

export async function hashStepUpToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return encodeHex(new Uint8Array(digest));
}

export async function createStepUpToken(): Promise<
  { token: string; hash: string }
> {
  const token = encodeBase64Url(
    crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)),
  );
  return { token, hash: await hashStepUpToken(token) };
}
