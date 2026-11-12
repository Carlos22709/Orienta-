/**
 * Lee los parámetros de la URL a la que Supabase devuelve a la app después
 * de Google, por ejemplo:
 *
 *   exp://192.168.0.10:8081/--/auth/callback?state=abc&code=xyz
 *
 * Supabase pone el código en la query y, si algo falla, puede poner el error
 * en la query o en el fragmento (#error=...). Se leen ambos.
 *
 * Se escribe a mano porque el URL de React Native no implementa todo el
 * estándar y las URL exp:// no siempre se interpretan igual.
 */
export interface CallbackParams {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
}

function parsePairs(part: string, into: Map<string, string>) {
  for (const pair of part.split('&')) {
    if (!pair) continue;
    const index = pair.indexOf('=');
    const rawKey = index === -1 ? pair : pair.slice(0, index);
    const rawValue = index === -1 ? '' : pair.slice(index + 1);
    const decode = (value: string) => {
      try {
        return decodeURIComponent(value.replace(/\+/g, ' '));
      } catch {
        return value;
      }
    };
    into.set(decode(rawKey), decode(rawValue));
  }
}

export function parseCallbackUrl(url: string): CallbackParams {
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex + 1);
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex === -1 ? '' : beforeHash.slice(queryIndex + 1);

  const params = new Map<string, string>();
  parsePairs(query, params);
  parsePairs(hash, params);

  return {
    code: params.get('code') || null,
    state: params.get('state') || null,
    error: params.get('error') || null,
    errorDescription: params.get('error_description') || null,
  };
}
