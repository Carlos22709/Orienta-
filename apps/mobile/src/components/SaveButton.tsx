import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';
import { notifySelection } from '../ui/feedback';
import { useAppDispatch, useAppSelector } from '../store';
import { savedToggled, selectSavedItems, type SavedOpportunity } from '../store/savedSlice';
import { minTouchTarget } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

/** Botón ♡ para guardar o quitar una oportunidad de "Guardadas". */
export function SaveButton({ opportunity }: { opportunity: Omit<SavedOpportunity, 'savedAt'> }) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectSavedItems).some((item) => item.id === opportunity.id);

  const toggle = () => {
    dispatch(savedToggled({ ...opportunity, savedAt: new Date().toISOString() }));
    notifySelection();
    AccessibilityInfo.announceForAccessibility(
      saved ? 'Quitada de guardadas' : 'Guardada',
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Quitar de guardadas' : 'Guardar oportunidad'}
      accessibilityState={{ selected: saved }}
      onPress={toggle}
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
