import type { AppSecrets } from "../deps.ts";

const ENV_NAMES: Record<keyof AppSecrets, string> = {
  totpEncryptionKey: "TOTP_ENCRYPTION_KEY",
  elevatedTokenSecret: "ELEVATED_TOKEN_SECRET",
};

/**
 * Devuelve un secreto del servidor o lanza un error claro si falta. El
 * error termina en 500 internal_error: el detalle queda solo en los registros.
 */
export function requireSecret(
  secrets: AppSecrets,
  name: keyof AppSecrets,
): string {
  const value = secrets[name];
  if (!value) {
    throw new Error(
      `Falta configurar el secreto ${ENV_NAMES[name]} de la Edge Function.`,
    );
  }
  return value;
}
