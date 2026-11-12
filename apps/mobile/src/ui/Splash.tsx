import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { BrandLockup } from './Logo';

/** Carga inicial con el logo, mientras se recupera la sesión. */
export function Splash() {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel="Orienta+. Cargando"
      style={[styles.splash, { backgroundColor: colors.background }]}
    >
      <BrandLockup size={104} />
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
