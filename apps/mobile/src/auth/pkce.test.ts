import {
  base64UrlEncode,
  createCodeChallenge,
  createCodeVerifier,
  createState,
  type Sha256,
} from './pkce';

/** SHA-256 de Web Crypto (Node): una implementación independiente de expo-crypto. */
const nodeSha256: Sha256 = async (input) =>
  new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)),
  );

/** Bytes fijos para que la prueba sea determinista. */
const fixedBytes = (value: number) => (count: number) =>
  new Uint8Array(count).fill(value);

describe('base64UrlEncode', () => {
  it('codifica los vectores de RFC 4648 sin relleno', () => {
    const encode = (text: string) =>
      base64UrlEncode(new TextEncoder().encode(text));

    expect(encode('')).toBe('');
    expect(encode('f')).toBe('Zg');
    expect(encode('fo')).toBe('Zm8');
    expect(encode('foo')).toBe('Zm9v');
    expect(encode('foob')).toBe('Zm9vYg');
    expect(encode('fooba')).toBe('Zm9vYmE');
    expect(encode('foobar')).toBe('Zm9vYmFy');
  });

  it('usa el alfabeto URL-safe ("-" y "_" en lugar de "+" y "/")', () => {
    expect(base64UrlEncode(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
  });
});

describe('PKCE (RFC 7636)', () => {
  it('calcula el code_challenge S256 del Apéndice B', async () => {
    // Vector oficial: RFC 7636, Apéndice B.
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

    await expect(createCodeChallenge(verifier, nodeSha256)).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('genera un code_verifier de 43 caracteres URL-safe a partir de 32 bytes', () => {
    const verifier = createCodeVerifier(fixedBytes(0xff));

    expect(verifier).toHaveLength(43);
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]{43}$/);
  });

  it('genera un state URL-safe de 16 bytes', () => {
    expect(createState(fixedBytes(0))).toBe('AAAAAAAAAAAAAAAAAAAAAA');
  });
});
