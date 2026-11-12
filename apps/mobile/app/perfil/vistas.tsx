import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import { useGetMyViewsQuery } from '../../src/store/api';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { BackButton, Card, Screen, ScreenHeader } from '../../src/ui/layout';

/** "12 de noviembre". */
function viewedOn(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
}

/**
 * Vistas recientemente (compromiso C3): las oportunidades que la persona ya
 * abrió, para retomarlas sin volver a buscarlas.
 */
export default function RecentlyViewedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, isFetching, refetch } = useGetMyViewsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <Screen>
      <BackButton />
      <ScreenHeader
        title="Vistas recientemente"
        subtitle="Las oportunidades que ya abriste, para retomarlas cuando quieras."
      />
      {isLoading ? (
        <LoadingState message="Cargando…" accessibilityLabel="Cargando tus oportunidades vistas" />
      ) : isError ? (
        <ErrorState onRetry={refetch} isRetrying={isFetching} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Todavía no has abierto ninguna"
          message="Cuando abras una oportunidad, aparecerá aquí."
        />
      ) : (
        data.map((view) => (
          <Card
            key={view.opportunityId}
            onPress={() =>
              router.push({ pathname: '/oportunidad/[id]', params: { id: view.opportunityId } })
            }
            accessibilityLabel={`${view.title}. Vista el ${viewedOn(view.firstViewedAt)}.`}
            accessibilityHint="Abre el detalle de la oportunidad"
          >
            <View style={styles.row}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
              <View style={styles.flex}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{view.title}</Text>
                <Text style={[typography.secondary, { color: colors.textMuted }]}>
                  Vista el {viewedOn(view.firstViewedAt)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
