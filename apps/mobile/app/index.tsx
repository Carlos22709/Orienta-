import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { env } from '../src/config/env';
import { useGetHealthQuery } from '../src/store/api';
import { minTouchTarget, spacing, typography } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

type ServerStatus = 'missing-config' | 'checking' | 'available' | 'unavailable';

const STATUS_MESSAGES: Record<ServerStatus, string> = {
  'missing-config':
    'Falta configurar la dirección del servidor (EXPO_PUBLIC_API_URL).',
  checking: 'Comprobando la conexión con el servidor…',
  available: 'El servidor está disponible.',
  unavailable:
    'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
};

// Íconos de refuerzo visual: el estado nunca depende solo del color (Fase 2, V2).
const STATUS_ICONS: Record<Exclude<ServerStatus, 'checking'>, string> = {
  'missing-config': '⚠',
  available: '✓',
  unavailable: '✕',
};

/**
 * Pantalla inicial provisional: comprueba de extremo a extremo que la app
 * llega a la API propia (GET /api/health). Se reemplazará por la bienvenida.
 */
export default function HomeScreen() {
  const { colors } = useTheme();
  const hasApiUrl = env.apiUrl !== null;
  const { isFetching, isSuccess, isError, refetch } = useGetHealthQuery(
    undefined,
    { skip: !hasApiUrl },
  );

  // Recuerda si el último resultado fue un error para mantener visible el botón
  // de reintento mientras se vuelve a consultar (evita que el foco se pierda).
  const [hasFailed, setHasFailed] = useState(false);
  useEffect(() => {
    if (isSuccess) setHasFailed(false);
    else if (isError) setHasFailed(true);
  }, [isSuccess, isError]);

  const status: ServerStatus = !hasApiUrl
    ? 'missing-config'
    : isFetching
      ? 'checking'
      : isSuccess
        ? 'available'
        : isError
          ? 'unavailable'
          : 'checking';

  // Anuncia al lector de pantalla cada cambio de estado posterior al primero.
  const previousStatus = useRef<ServerStatus | null>(null);
  useEffect(() => {
    if (previousStatus.current !== null && previousStatus.current !== status) {
      AccessibilityInfo.announceForAccessibility(STATUS_MESSAGES[status]);
    }
    previousStatus.current = status;
  }, [status]);

  const statusColor = {
    'missing-config': colors.warning,
    checking: colors.primary,
    available: colors.success,
    unavailable: colors.danger,
  }[status];

  const isRetrying = status === 'checking';
  const showRetry = hasApiUrl && hasFailed && status !== 'available';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          accessibilityRole="header"
          style={[typography.screenTitle, { color: colors.text }]}
        >
          Orienta+
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Oportunidades reales, claras y seguras para dar el siguiente paso.
        </Text>

        {/* Tarjeta agrupada: el lector la anuncia como una sola unidad (F2). */}
        <View
          accessible
          accessibilityLabel={`Estado del servidor. ${STATUS_MESSAGES[status]}`}
          style={[
            styles.statusCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[typography.cardTitle, { color: colors.text }]}>
            Estado del servidor
          </Text>
          <View style={styles.statusRow}>
            {status === 'checking' ? (
              <ActivityIndicator color={statusColor} />
            ) : (
              <Text style={[typography.cardTitle, { color: statusColor }]}>
                {STATUS_ICONS[status]}
              </Text>
            )}
            <Text
              style={[typography.body, styles.statusText, { color: colors.text }]}
            >
              {STATUS_MESSAGES[status]}
            </Text>
          </View>
        </View>

        {showRetry && (
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Vuelve a comprobar la conexión con el servidor"
            accessibilityState={{ disabled: isRetrying, busy: isRetrying }}
            disabled={isRetrying}
            onPress={refetch}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                typography.body,
                styles.buttonLabel,
                { color: colors.onPrimary },
              ]}
            >
              {isRetrying ? 'Reintentando…' : 'Reintentar'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  statusText: {
    flex: 1,
  },
  button: {
    minHeight: minTouchTarget,
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontWeight: '600',
  },
});
