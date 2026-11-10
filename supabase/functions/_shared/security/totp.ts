import { encodeBase32 } from "./base32.ts";

/**
 * TOTP según RFC 6238, sobre HOTP de RFC 4226, escrito por el equipo
 * (decisión 0002). Solo usa Web Crypto para HMAC-SHA1; no usa librerías de
 * TOTP como otplib o speakeasy.
 */

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;
/** Ventanas de tolerancia a cada lado por desfase de reloj (C-1, C, C+1). */
export const TOTP_ALLOWED_DRIFT_STEPS = 1;
/** 160 bits, el tamaño recomendado por RFC 4226 para HMAC-SHA1. */
export const SECRET_LENGTH_BYTES = 20;

/** Ventana de tiempo: T = floor(tiempo Unix / 30). */
export function timeStep(unixSeconds: number): number {
  return Math.floor(unixSeconds / TOTP_PERIOD_SECONDS);
}

/** Código HOTP para un contador (RFC 4226, sección 5.3). */
export async function generateHotp(
  secret: Uint8Array,
  counter: number,
  digits = TOTP_DIGITS,
): Promise<string> {
  // 1. El contador se codifica como entero de 64 bits big-endian (8 bytes).
  const message = new Uint8Array(8);
  new DataView(message.buffer).setBigUint64(0, BigInt(counter), false);

  // 2. H = HMAC-SHA1(secreto, contador) → 20 bytes.
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, message));

  // 3. Truncamiento dinámico: los 4 bits bajos del último byte (H[19]) dan
  //    el desplazamiento; se toman 4 bytes desde ahí y se descarta el bit de
  //    signo con & 0x7f para obtener un entero positivo de 31 bits.
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // 4. Se reduce a `digits` cifras, conservando ceros a la izquierda.
  return String(binCode % 10 ** digits).padStart(digits, "0");
}

/** Código TOTP para un instante (RFC 6238, sección 4.2). */
export function generateTotp(
  secret: Uint8Array,
  unixSeconds: number,
  digits = TOTP_DIGITS,
): Promise<string> {
  return generateHotp(secret, timeStep(unixSeconds), digits);
}

export type TotpVerification =
  | { ok: true; step: number }
  | { ok: false; reason: "invalid_format" | "invalid_code" | "replayed" };

/**
 * Verifica un código TOTP con tolerancia de ±1 ventana y anti-replay.
 *
 * `lastUsedStep` es la última ventana aceptada para esa persona (se guarda en
 * Postgres porque las Edge Functions no comparten memoria). Siguiendo
 * RFC 6238 §5.2, se rechaza cualquier ventana igual o anterior a ella. Si la
 * verificación es exitosa, quien llama debe guardar `step` como nueva
 * última ventana usada.
 */
export async function verifyTotp(params: {
  secret: Uint8Array;
  code: string;
  unixSeconds: number;
  lastUsedStep?: number | null;
}): Promise<TotpVerification> {
  // Se aceptan espacios porque el código puede pegarse como "123 456" (WCAG 3.3.8).
  const code = params.code.replace(/\s+/g, "");
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(code)) {
    return { ok: false, reason: "invalid_format" };
  }

  const current = timeStep(params.unixSeconds);
  const candidateSteps = [current];
  for (let drift = 1; drift <= TOTP_ALLOWED_DRIFT_STEPS; drift++) {
    candidateSteps.push(current - drift, current + drift);
  }

  for (const step of candidateSteps) {
    const expected = await generateHotp(params.secret, step);
    if (constantTimeEqual(expected, code)) {
      const lastUsed = params.lastUsedStep ?? null;
      if (lastUsed !== null && step <= lastUsed) {
        return { ok: false, reason: "replayed" };
      }
      return { ok: true, step };
    }
  }
  return { ok: false, reason: "invalid_code" };
}

/** Secreto aleatorio para inscribir un nuevo factor TOTP. */
export function generateSecret(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SECRET_LENGTH_BYTES));
}

/**
 * URI otpauth://totp que se muestra como código QR (formato Key URI de
 * Google Authenticator).
 */
export function buildOtpauthUri(params: {
  secret: Uint8Array;
  accountName: string;
  issuer: string;
}): string {
  const label = `${encodeURIComponent(params.issuer)}:${
    encodeURIComponent(params.accountName)
  }`;
  const query = new URLSearchParams({
    secret: encodeBase32(params.secret),
    issuer: params.issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${query}`;
}

/**
 * Compara dos códigos sin cortar en el primer carácter distinto, para no
 * revelar por tiempo de respuesta cuántos dígitos coinciden.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}
