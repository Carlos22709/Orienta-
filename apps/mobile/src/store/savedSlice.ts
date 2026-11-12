import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { sessionEnded } from './authSlice';

/**
 * Oportunidades guardadas (♡). Se guardan solo en este teléfono
 * (src/saved/persistence.ts), no en el servidor. Se borran al cerrar sesión o
 * eliminar la cuenta, para no dejar datos de una persona a la siguiente.
 */
export interface SavedOpportunity {
  id: string;
  title: string;
  category: string;
  entityName: string;
  deadline: string | null;
  savedAt: string;
}

export interface SavedState {
  items: SavedOpportunity[];
  /** true cuando ya se leyó lo guardado en el teléfono. */
  hydrated: boolean;
}

const initialState: SavedState = { items: [], hydrated: false };

export const savedSlice = createSlice({
  name: 'saved',
  initialState,
  reducers: {
    savedHydrated(state, action: PayloadAction<SavedOpportunity[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
    savedToggled(state, action: PayloadAction<SavedOpportunity>) {
      const exists = state.items.some((item) => item.id === action.payload.id);
      state.items = exists
        ? state.items.filter((item) => item.id !== action.payload.id)
        : [action.payload, ...state.items];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionEnded, (state) => {
      state.items = [];
    });
  },
  selectors: {
    selectSavedItems: (state) => state.items,
    selectSavedHydrated: (state) => state.hydrated,
  },
});

export const { savedHydrated, savedToggled } = savedSlice.actions;
export const { selectSavedItems, selectSavedHydrated } = savedSlice.selectors;
