import type { SavedItem, SavedItemInput } from '../store/api';

/**
 * Cambios a la lista de guardadas que la app aplica al instante, antes de
 * que responda el servidor (actualización optimista en src/store/api.ts).
 * Si la petición falla, RTK Query deshace el cambio.
 *
 * La lista puede ser undefined: RTK Query llama a la receta sin datos cuando
 * GET /me/saved falló (por ejemplo, sin conexión). En ese caso no hay nada que
 * editar; la petición de guardar o quitar sigue su curso igual.
 */

/** Agrega la oportunidad al inicio; si ya estaba, deja la lista igual. */
export function addSaved(
  list: SavedItem[] | undefined,
  item: SavedItemInput,
  savedAt: string,
): SavedItem[] | undefined {
  if (!list || list.some((saved) => saved.id === item.id)) return list;
  return [{ ...item, savedAt }, ...list];
}

/** Quita la oportunidad; si no estaba, deja la lista igual. */
export function removeSaved(list: SavedItem[] | undefined, id: string): SavedItem[] | undefined {
  return list?.filter((saved) => saved.id !== id);
}
