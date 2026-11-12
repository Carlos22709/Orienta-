import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OpportunityCard } from '../../src/components/OpportunityCard';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import { readApiError } from '../../src/security/apiError';
import { useGetRecommendationsQuery } from '../../src/store/api';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { Button } from '../../src/ui/Button';
import { Notice } from '../../src/ui/layout';

/** Saludo según la hora del día. */
function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * "Para ti": las 4 o 5 recomendaciones (reglas de la decisión 0005), con el
 * porqué de cada una. Basado en la pantalla de recomendaciones de Juan.
 */
export default function ForYouScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const recommendations = useGetRecommendationsQuery();
  const { data, isLoading, isError, error, isFetching, refetch } = recommendations;

  const header = (
    <View style={styles.header}>
      <Text style={[typography.secondary, { color: colors.textMuted }]}>{greeting()} 👋</Text>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
        {data ? `Tus ${data.items.length} oportunidades` : 'Tus oportunidades'}
      </Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Elegidas según tus respuestas. Toca una para ver requisitos y cómo postularte.
      </Text>
      {data?.message ? <Notice text={data.message} /> : null}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
        <LoadingState
          message="Buscando tus oportunidades…"
          accessibilityLabel="Buscando tus oportunidades, por favor espera"
        />
      </SafeAreaView>
    );
  }

  if (isError) {
    const apiError = readApiError(error);
    const incomplete = apiError.code === 'profile_incomplete';
    return (
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.padded}>
          {incomplete ? (
            <>
              <EmptyState
                title="Nos faltan algunas respuestas"
                message="Termina el cuestionario para ver las oportunidades pensadas para ti."
              />
              <Button label="Terminar cuestionario" onPress={() => router.push('/cuestionario')} />
            </>
          ) : (
            <ErrorState
              title="No pudimos cargar tus oportunidades"
              message={apiError.message}
              onRetry={refetch}
              isRetrying={isFetching}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            title="Aún no hay oportunidades para ti"
            message="Revisa Explorar o ajusta tus respuestas en Perfil."
          />
        }
        renderItem={({ item }) => (
          <OpportunityCard
            opportunity={item}
            onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => void refetch()} tintColor={colors.primary} />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
});
