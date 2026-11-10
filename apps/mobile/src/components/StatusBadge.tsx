import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { getStatusBadgeVisual, type ValidityKind } from './statusBadgeHelper';

export { getStatusBadgeVisual, type ValidityKind };

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
      <Text
        style={[
          styles.text,
          { color: visual.textColor },
        ]}
      >
        <Text style={styles.icon}>{visual.icon} </Text>
        {visual.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.secondary,
    fontWeight: '600',
  },
  icon: {
    fontWeight: '700',
  },
});
