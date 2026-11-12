import React, { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export interface LoadingStateProps {
  message?: string;
  accessibilityLabel?: string;
}

/**
 * Estado de carga accesible (WCAG 4.1.3 - compromiso F3).
 * Muestra un indicador visual y anuncia el inicio de carga a lectores de pantalla.
 */
export function LoadingState({
  message = 'Cargando información…',
  accessibilityLabel = 'Cargando contenido, por favor espera',
}: LoadingStateProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(accessibilityLabel);
  }, [accessibilityLabel]);

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={styles.container}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.textMuted }]}>
        {message}
      </Text>
    </View>
  );
}

// Se crean en cada render para usar el tamaño de texto vigente (Accesibilidad).
const createStyles = () =>
  StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  message: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
