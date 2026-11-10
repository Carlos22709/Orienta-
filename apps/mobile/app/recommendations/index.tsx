import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OpportunityCard, type OpportunityItem } from '../../src/components/OpportunityCard';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import { useGetRecommendationsQuery } from '../../src/store/api';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

/**
 * Pantalla principal de resultados y recomendaciones (entregable de Juan).
 *
 * Muestra entre 4 y 5 opciones vigentes y elegibles para reducir la carga cognitiva.
 * Incluye estados accesibles de carga, vacío, error y reintento con anuncios para TalkBack/VoiceOver.
 */
export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetRecommendationsQuery();

  const handleSelectOpportunity = useCallback(
    (id: string) => {
      router.push({
        pathname: '/opportunity/[id]',
        params: { id },
      });
    },
    [router],
  );

  const renderItem: ListRenderItem<OpportunityItem> = useCallback(
    ({ item }) => (
      <OpportunityCard
        opportunity={item}
        onPress={() => handleSelectOpportunity(item.id)}
      />
    ),
    [handleSelectOpportunity],
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              style={[typography.screenTitle, { color: colors.text }]}
            >
              Oportunidades recomendadas
            </Text>
            <Text style={[typography.body, styles.subtitle, { color: colors.textMuted }]}>
              Seleccionamos entre cuatro y cinco opciones verificadas de acuerdo con tu perfil y ubicación.
            </Text>

            {data?.insufficient && data.message && (
              <View
                accessible={true}
                accessibilityRole="text"
                style={[
                  styles.insufficientBanner,
                  { backgroundColor: colors.surface, borderColor: colors.warning },
                ]}
              >
                <Text style={[styles.insufficientText, { color: colors.warning }]}>
                  ⚠ {data.message}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingState message="Buscando convocatorias vigentes para tu perfil…" />
          ) : isError ? (
            <ErrorState
              message="No pudimos consultar las recomendaciones. Revisa tu conexión a internet e intenta de nuevo."
              onRetry={refetch}
              isRetrying={isFetching}
            />
          ) : (
            <EmptyState
              title="Sin recomendaciones disponibles"
              message={
                data?.message ??
                'No encontramos convocatorias vigentes que coincidan con tu perfil en este momento.'
              }
              actionLabel="Actualizar convocatorias"
              onAction={refetch}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  insufficientBanner: {
    borderRadius: 8,
    borderWidth: 1.5,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  insufficientText: {
    ...typography.secondary,
    fontWeight: '600',
    lineHeight: 20,
  },
});
