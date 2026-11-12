import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { minTouchTarget, radius, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  hint?: string;
  busy?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Botón accesible de Orienta+: área táctil mínima de 48, rol de botón y
 * estados disabled/busy expuestos al lector de pantalla. El texto ocupado
 * reemplaza a la etiqueta para que se anuncie el progreso.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  hint,
  busy = false,
  disabled = false,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || busy;

  const look = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: look.bg,
          borderColor: look.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {busy ? (
          <ActivityIndicator color={look.fg} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={look.fg} />
        ) : null}
        <Text style={[typography.bodyStrong, { color: look.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchTarget + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
