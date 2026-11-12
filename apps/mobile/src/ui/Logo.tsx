import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fonts, scaled } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

interface LogoMarkProps {
  size?: number;
}

/**
 * Logo de Orienta+: una brújula que orienta hacia el siguiente paso. Es
 * decorativo para el lector de pantalla; el nombre de la app va en texto.
 */
export function LogoMark({ size = 96 }: LogoMarkProps) {
  const { colors } = useTheme();
  const light = '#FFF4E6';
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect width={96} height={96} rx={24} fill={colors.accent} />
      <Circle cx={48} cy={48} r={30} fill="none" stroke={light} strokeWidth={5} />
      <Path d="M48 22 L56 48 L48 74 L40 48 Z" fill={light} />
      <Path d="M48 22 L56 48 L40 48 Z" fill="#FFC9A8" />
      <Circle cx={48} cy={48} r={5} fill={colors.accent} />
    </Svg>
  );
}

/** Nombre de la app con el "+" en el color de marca. */
export function Wordmark({ size = 30 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.wordmark, { fontSize: scaled(size), lineHeight: scaled(size * 1.25), color: colors.text }]}
    >
      Orienta<Text style={{ color: colors.primary }}>+</Text>
    </Text>
  );
}

/** Logo y nombre centrados, para la bienvenida y la carga inicial. */
export function BrandLockup({ size = 96 }: LogoMarkProps) {
  return (
    <View style={styles.lockup}>
      <LogoMark size={size} />
      <Wordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.extrabold,
    letterSpacing: -0.5,
  },
  lockup: {
    alignItems: 'center',
    gap: 14,
  },
});
