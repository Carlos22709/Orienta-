import { sessionEnded } from './authSlice';
import { savedHydrated, savedSlice, savedToggled } from './savedSlice';

const reducer = savedSlice.reducer;
const item = (id: string) => ({
  id,
  title: `Oportunidad ${id}`,
  category: 'training',
  entityName: 'Entidad',
  deadline: null,
  savedAt: '2026-11-12T10:00:00.000Z',
});

describe('savedSlice', () => {
  it('guardar dos veces la misma oportunidad la quita (♡ alterna)', () => {
    const once = reducer(undefined, savedToggled(item('a')));
    expect(once.items.map((i) => i.id)).toEqual(['a']);

    const twice = reducer(once, savedToggled(item('a')));
    expect(twice.items).toEqual([]);
  });

  it('la última guardada queda primero', () => {
    let state = reducer(undefined, savedToggled(item('a')));
    state = reducer(state, savedToggled(item('b')));
    expect(state.items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('al leer lo guardado en el teléfono queda hidratado', () => {
    const state = reducer(undefined, savedHydrated([item('a')]));
    expect(state).toEqual({ items: [item('a')], hydrated: true });
  });

  it('al cerrar sesión se borran las guardadas', () => {
    const state = reducer(
      reducer(undefined, savedHydrated([item('a')])),
      sessionEnded('signedOut'),
    );
    expect(state.items).toEqual([]);
    expect(state.hydrated).toBe(true);
  });
});
