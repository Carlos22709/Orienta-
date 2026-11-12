import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OpportunityCard } from '../../src/components/OpportunityCard';
import { EmptyState } from '../../src/components/states/EmptyState';
import { ErrorState } from '../../src/components/states/ErrorState';
import { LoadingState } from '../../src/components/states/LoadingState';
import { useGetOpportunitiesQuery } from '../../src/store/api';
import { minTouchTarget, radius, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { CATEGORIES } from '../../src/ui/categories';

/** Quita tildes y mayúsculas para buscar sin importar cómo se escriba. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Explorar: todas las oportunidades verificadas y vigentes, además de las
 * recomendadas. Filtro por categoría y búsqueda por texto.
 */
export default function ExploreScreen() {
  const { colors, categories } = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, isFetching, refetch } = useGetOpportunitiesQuery();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of data ?? []) result[item.category] = (result[item.category] ?? 0) + 1;
    return result;
  }, [data]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (data ?? []).filter(
      (item) =>
        (!category || item.category === category) &&
        (q === '' ||
          normalize(`${item.title} ${item.entityName} ${item.summaryPlain}`).includes(q)),
    );
  }, [data, query, category]);

  const header = (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
        Explorar
      </Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Todas las oportunidades verificadas por el equipo de Orienta+.
      </Text>

      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre o entidad"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Buscar oportunidades"
          returnKeyType="search"
          style={[typography.body, styles.searchInput, { color: colors.text }]}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          label={`Todas · ${data?.length ?? 0}`}
          selected={category === null}
          onPress={() => setCategory(null)}
          tone={colors.surfaceAlt}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.key}
            label={`${c.plural} · ${counts[c.key] ?? 0}`}
            icon={c.icon}
            selected={category === c.key}
            onPress={() => setCategory(category === c.key ? null : c.key)}
            tone={categories[c.key]}
          />
        ))}
      </ScrollView>

      <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.textMuted }]}>
        {filtered.length === 1 ? '1 resultado' : `${filtered.length} resultados`} · primero las que cierran antes
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
        <LoadingState message="Cargando oportunidades…" accessibilityLabel="Cargando oportunidades, por favor espera" />
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.list}>
          <ErrorState onRetry={refetch} isRetrying={isFetching} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            title="Sin resultados"
            message="Prueba con otra palabra o elige otra categoría."
          />
        }
        renderItem={({ item }) => (
          <OpportunityCard
            opportunity={{ ...item, reasons: [] }}
            onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  icon,
  selected,
  onPress,
  tone,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
  tone: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label.replace(' · ', ', ')}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: tone,
          borderColor: selected ? colors.primary : 'transparent',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={colors.text} /> : null}
      <Text style={[typography.label, { color: colors.text }]}>{label}</Text>
      {selected ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: minTouchTarget,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    minHeight: minTouchTarget - 8,
  },
});
