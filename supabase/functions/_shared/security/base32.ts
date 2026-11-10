/**
 * Base32 según RFC 4648 (alfabeto A–Z y 2–7), escrito por el equipo.
 * Es el formato en que las apps autenticadoras reciben la semilla TOTP.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Codifica bytes en Base32 sin relleno "=" (formato de los URI otpauth). */
export function encodeBase32(bytes: Uint8Array): string {
  let output = "";
  let buffer = 0; // bits pendientes por emitir
  let bits = 0; // cuántos bits válidos hay en buffer

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    // Cada carácter Base32 representa 5 bits.
    while (bits >= 5) {
      output += ALPHABET[(buffer >>> (bits - 5)) & 0b11111];
      bits -= 5;
      buffer &= (1 << bits) - 1; // descarta los bits ya emitidos
    }
  }

  // Los bits sobrantes se completan con ceros a la derecha.
  if (bits > 0) output += ALPHABET[(buffer << (5 - bits)) & 0b11111];
  return output;
}

/**
 * Decodifica Base32. Acepta minúsculas, espacios y relleno "=" al final,
 * porque una persona puede pegar la semilla tal como la copió.
 */
export function decodeBase32(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, "").replace(/=+$/, "").toUpperCase();
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new RangeError(`Carácter Base32 inválido: "${char}".`);
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
      buffer &= (1 << bits) - 1;
    }
  }

  // Los bits restantes (< 8) son relleno de la codificación y se descartan.
  return new Uint8Array(output);
}
