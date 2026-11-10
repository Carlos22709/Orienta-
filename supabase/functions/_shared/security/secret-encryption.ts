import { decodeBase64 } from "@std/encoding/base64";

/**
 * Cifrado en reposo de los secretos TOTP con AES-GCM de 256 bits (decisión 0002).
 * La clave viene del secreto TOTP_ENCRYPTION_KEY de la Edge Function, en Base64.
 * AES-GCM autentica el contenido: si el texto cifrado se altera, descifrar falla.
 */

const KEY_LENGTH_BYTES = 32;
/** 96 bits, el tamaño de IV recomendado para AES-GCM. */
const IV_LENGTH_BYTES = 12;

export interface EncryptedSecret {
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

export function importEncryptionKey(base64Key: string): Promise<CryptoKey> {
  const raw = decodeBase64(base64Key);
  if (raw.length !== KEY_LENGTH_BYTES) {
    return Promise.reject(
      new RangeError(
        `La clave de cifrado debe tener ${KEY_LENGTH_BYTES} bytes; tiene ${raw.length}.`,
      ),
    );
  }
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<EncryptedSecret> {
  // Un IV nuevo en cada cifrado: reutilizarlo con la misma clave rompe AES-GCM.
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new Uint8Array(plaintext),
    ),
  );
  return { iv, ciphertext };
}

export async function decryptSecret(
  key: CryptoKey,
  encrypted: EncryptedSecret,
): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encrypted.iv) },
      key,
      new Uint8Array(encrypted.ciphertext),
    ),
  );
}
