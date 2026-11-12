import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';
import { notifyError, notifySelection } from '../ui/feedback';
import {
  type SavedItemInput,
  useGetSavedQuery,
  useSaveOpportunityMutation,
  useUnsaveOpportunityMutation,
} from '../store/api';
import { minTouchTarget } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

/**
 * Botón ♡ para guardar o quitar una oportunidad de "Guardadas". La lista vive
 * en el servidor (GET /api/me/saved). El corazón cambia al instante y, si la
 * petición falla, vuelve a su estado anterior con un aviso de error.
 */
export function SaveButton({ opportunity }: { opportunity: SavedItemInput }) {
  const { colors } = useTheme();
  const { data: savedItems = [] } = useGetSavedQuery();
  const [save, saveState] = useSaveOpportunityMutation();
  const [unsave, unsaveState] = useUnsaveOpportunityMutation();
  const saved = savedItems.some((item) => item.id === opportunity.id);
  // Mientras una petición está en curso no se acepta otro toque, para que un
  // guardar y un quitar no lleguen al servidor en desorden.
  const busy = saveState.isLoading || unsaveState.isLoading;

  const toggle = async () => {
    notifySelection();
    AccessibilityInfo.announceForAccessibility(saved ? 'Quitada de guardadas' : 'Guardada');
    try {
      await (saved ? unsave(opportunity.id) : save(opportunity)).unwrap();
    } catch {
      notifyError(
        saved
          ? 'No pudimos quitarla de guardadas. Revisa tu conexión e intenta de nuevo.'
          : 'No pudimos guardarla. Revisa tu conexión e intenta de nuevo.',
      );
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Quitar de guardadas' : 'Guardar oportunidad'}
      accessibilityState={{ selected: saved, busy }}
      onPress={toggle}
      disabled={busy}
      hitSlop={6}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={26}
        color={saved ? colors.accent : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
