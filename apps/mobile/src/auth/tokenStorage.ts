import * as SecureStore from 'expo-secure-store';

/**
 * Almacenamiento del refresh_token (decisión 0002).
 *
 * Solo se guarda este valor, nunca la sesión completa ni el access_token,
 * que vive únicamente en memoria (Redux). expo-secure-store usa Keychain en
 * iOS y Keystore en Android.
 */
export interface TokenStorage {
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clear(): Promise<void>;
}

const REFRESH_TOKEN_KEY = 'orienta.refresh_token';

const OPTIONS: SecureStore.SecureStoreOptions = {
  // No se sincroniza con iCloud ni se restaura en otro dispositivo.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureTokenStorage: TokenStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY, OPTIONS),
  setRefreshToken: (token) =>
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, OPTIONS),
  clear: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, OPTIONS),
};

