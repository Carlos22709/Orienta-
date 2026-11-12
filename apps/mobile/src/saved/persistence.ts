import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { AppDispatch, RootState } from '../store';
import { savedHydrated, type SavedOpportunity } from '../store/savedSlice';

/**
 * Guarda la lista de oportunidades guardadas en el teléfono. No contiene
 * datos personales del perfil: solo identificadores y títulos públicos.
 */
const KEY = 'orienta.saved.v1';

const savedSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    entityName: z.string(),
    deadline: z.string().nullable(),
    savedAt: z.string(),
  }),
);

export async function loadSaved(dispatch: AppDispatch): Promise<void> {
  let items: SavedOpportunity[] = [];
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = savedSchema.safeParse(raw ? JSON.parse(raw) : []);
    if (parsed.success) items = parsed.data;
  } catch {
    // Si el almacenamiento falla, se empieza con la lista vacía.
  }
  dispatch(savedHydrated(items));
}

/** Escribe la lista cada vez que cambia. Devuelve la función para dejar de escuchar. */
export function persistSaved(store: {
  getState: () => RootState;
  subscribe: (listener: () => void) => () => void;
}): () => void {
  let last = store.getState().saved.items;
  return store.subscribe(() => {
    const { items, hydrated } = store.getState().saved;
    if (!hydrated || items === last) return;
    last = items;
    AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {
      // Sin almacenamiento, la lista sigue en memoria mientras la app esté abierta.
    });
  });
}
