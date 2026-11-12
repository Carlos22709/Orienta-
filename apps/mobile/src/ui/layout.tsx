import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import {
  cardShadow,
  minTouchTarget,
  radius,
  spacing,
  typography,
} from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

/** Contenedor estándar de pantalla: área segura, fondo y desplazamiento. */
export function Screen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Encabezado de pantalla con título grande y subtítulo opcional. */
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {eyebrow ? (
        <Text style={[typography.secondary, { color: colors.textMuted }]}>{eyebrow}</Text>
      ) : null}
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

/** Botón "Atrás" visible, para pantallas sin encabezado nativo. */
export function BackButton({ label = 'Atrás' }: { label?: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={8}
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={22} color={colors.primary} />
      <Text style={[typography.bodyStrong, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

/** Tarjeta con sombra suave. Si recibe onPress, es un botón accesible. */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  tone,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  tone?: string;
}) {
  const { colors } = useTheme();
  const base = [
    styles.card,
    cardShadow(colors.shadow),
    { backgroundColor: tone ?? colors.surface, borderColor: colors.divider },
    style,
  ];
  if (!onPress) {
    return <View style={base}>{children}</View>;
  }
  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [...base, { opacity: pressed ? 0.9 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

/** Fila de menú (Perfil): ícono, texto, valor opcional y flecha. */
export function MenuRow({
  icon,
  label,
  value,
  onPress,
  hint,
  danger = false,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  hint?: string;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.divider },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      <Text style={[typography.body, styles.rowLabel, { color }]}>{label}</Text>
      {value ? (
        <Text style={[typography.secondary, { color: colors.textMuted }]}>{value}</Text>
      ) : null}
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

/** Barra de progreso del cuestionario, anunciada como valor. */
export function ProgressBar({ step, total }: { step: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${step} de ${total}`}
      accessibilityValue={{ min: 0, max: total, now: step }}
      style={[styles.track, { backgroundColor: colors.chip }]}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: colors.accent, width: `${(step / total) * 100}%` },
        ]}
      />
    </View>
  );
}

/** Aviso en línea (información o error), anunciado como región viva. */
export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' }) {
  const { colors } = useTheme();
  const color = tone === 'error' ? colors.danger : colors.text;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.notice,
        { backgroundColor: colors.surfaceAlt, borderColor: tone === 'error' ? colors.danger : colors.divider },
      ]}
    >
      <Ionicons
        name={tone === 'error' ? 'alert-circle' : 'information-circle'}
        size={20}
        color={tone === 'error' ? colors.danger : colors.primary}
      />
      <Text style={[typography.secondary, styles.noticeText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs, marginTop: spacing.sm },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: minTouchTarget,
    gap: 2,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouchTarget + 8,
    gap: spacing.md,
  },
  rowLabel: { flex: 1 },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  noticeText: { flex: 1 },
});
