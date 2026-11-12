import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { minTouchTarget, spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

/**
 * Estado vacío accesible (WCAG 3.3.1, 4.1.3 - compromiso F3, C2).
 * Comunica con claridad la ausencia o insuficiencia de resultados y ofrece
 * un camino de acción directo (por ejemplo, revisar o editar el perfil).
 */
export function EmptyState({
  title = 'No encontramos convocatorias',
  message,
  actionLabel,
  onAction,
  icon = 'search',
}: EmptyStateProps) {
  const { colors } = useTheme();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);
  }, [title, message]);

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${message}`}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <Ionicons name={icon} size={40} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: spacing.xl,
    marginVertical: spacing.md,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.cardTitle,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: spacing.lg,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
  },
});
