/**
 * Valida si una URL es una dirección web HTTP o HTTPS válida.
 *
 * Rechaza esquemas peligrosos como javascript:, data:, file: o cadenas malformadas.
 */
export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export interface OpenUrlResult {
  success: boolean;
  error?: 'invalid_url' | 'open_failed';
}

/**
 * Abre el enlace oficial de postulación o inscripción en el navegador del
 * sistema usando expo-web-browser (decisiones 0002 y 0004).
 *
 * Nunca usa WebView embebido para proteger la seguridad y privacidad del usuario.
 */
export async function openOfficialUrl(
  url: string | null | undefined,
): Promise<OpenUrlResult> {
  if (!isValidHttpUrl(url)) {
    return { success: false, error: 'invalid_url' };
  }

  try {
    const WebBrowser = await import('expo-web-browser');
    await WebBrowser.openBrowserAsync(url!.trim(), {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
    return { success: true };
  } catch {
    return { success: false, error: 'open_failed' };
  }
}
