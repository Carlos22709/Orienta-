import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { getStatusBadgeVisual, type ValidityKind } from './statusBadgeHelper';

export { getStatusBadgeVisual, type ValidityKind };

/** Ícono vectorial por estado: la vigencia nunca depende solo del color. */
const ICONS = {
  open: 'checkmark-circle',
  closing_soon: 'time',
  closed: 'close-circle',
} as const;

export interface StatusBadgeProps {
  validity: ValidityKind;
}

/**
 * Badge de vigencia accesible (WCAG 1.4.1 - compromiso V2).
 * Combina texto, ícono y color con contraste verificado para que la vigencia
 * nunca dependa únicamente del color.
 */
export function StatusBadge({ validity }: StatusBadgeProps) {
  const { colors } = useTheme();
  const visual = getStatusBadgeVisual(validity, colors);

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={visual.label}
      style={[
        styles.badge,
        {
          backgroundColor: visual.backgroundColor,
          borderColor: visual.borderColor,
        },
      ]}
    >
      <Ionicons name={ICONS[validity.kind]} size={14} color={visual.textColor} />
      <Text style={[styles.text, { color: visual.textColor }]}>{visual.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  text: {
    ...typography.label,
  },
});
