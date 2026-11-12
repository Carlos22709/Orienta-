import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { minTouchTarget, spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/**
 * Estado de error con reintento accesible (WCAG 3.3.1, 4.1.3 - compromiso F3).
 * Mantiene montado el botón de reintento durante la recarga para que el lector
 * de pantalla no pierda el foco de interacción.
 */
export function ErrorState({
  title = 'No pudimos cargar la información',
  message = 'Ocurrió un problema de conexión. Revisa tu acceso a internet e intenta de nuevo.',
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);
  }, [title, message]);

  // Solo el ícono y los textos forman un grupo para el lector. El botón queda
  // fuera: en iOS, un elemento `accessible` oculta a sus hijos y VoiceOver no
  // podría llegar a "Reintentar" (hallazgo H1).
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.danger,
        },
      ]}
    >
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`${title}. ${message}`}
        style={styles.content}
      >
        <Ionicons name="alert-circle" size={40} color={colors.danger} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      </View>

      {onRetry && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRetrying ? 'Reintentando conexión…' : 'Reintentar cargar información'}
          accessibilityHint="Toca dos veces para volver a consultar el servidor"
          accessibilityState={{ busy: isRetrying, disabled: isRetrying }}
          disabled={isRetrying}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isRetrying ? 0.75 : 1,
            },
          ]}
        >
          {isRetrying ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={[styles.retryText, { color: colors.onPrimary }]}>
              Reintentar
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

// Se crean en cada render para usar el tamaño de texto vigente (Accesibilidad).
const createStyles = () =>
  StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    marginVertical: spacing.md,
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.cardTitle,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: spacing.lg,
    minHeight: minTouchTarget,
    minWidth: 140,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    ...typography.body,
    fontWeight: '600',
  },
});
