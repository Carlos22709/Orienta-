import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Antes las guardadas vivían solo en el teléfono, bajo esta clave, y se
 * borraban al cerrar sesión. Ahora viven en el servidor (GET /api/me/saved).
 * Al abrir la app se borra la copia antigua: no estaba asociada a ninguna
 * cuenta, así que no se puede subir sin riesgo de mezclar la lista de dos
 * personas que usaron el mismo teléfono.
 */
const LEGACY_KEY = 'orienta.saved.v1';

export async function forgetLegacySavedList(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch {
    // Si el almacenamiento falla, la copia antigua queda sin usar; no pasa nada.
  }
}
