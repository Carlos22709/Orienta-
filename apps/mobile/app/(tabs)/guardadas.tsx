import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SaveButton } from '../../src/components/SaveButton';
import { useAppSelector } from '../../src/store';
import { selectSavedItems } from '../../src/store/savedSlice';
import { radius, spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { Button } from '../../src/ui/Button';
import { Card } from '../../src/ui/layout';
import { categoryMeta, isCategoryKey } from '../../src/ui/categories';

/** "dd de mes" para la fecha de cierre. */
function shortDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
  });
}

/** Guardadas: las oportunidades marcadas con ♡, guardadas en este teléfono. */
export default function SavedScreen() {
  const { colors, categories } = useTheme();
  const router = useRouter();
  const items = useAppSelector(selectSavedItems);

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, items.length === 0 && styles.flexGrow]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
              Guardadas
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Las oportunidades que marcaste con ♡ para revisar después.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.chip }]}>
              <Ionicons name="heart-outline" size={40} color={colors.accent} />
            </View>
            <Text style={[typography.cardTitle, styles.center, { color: colors.text }]}>
              Aún no guardas ninguna
            </Text>
            <Text style={[typography.body, styles.center, { color: colors.textMuted }]}>
              Toca el ♡ en una oportunidad para tenerla a mano aquí.
            </Text>
            <Button label="Explorar oportunidades" variant="secondary" onPress={() => router.push('/explorar')} />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => {
          const meta = categoryMeta(item.category);
          const tone = isCategoryKey(item.category) ? categories[item.category] : colors.chip;
          return (
            <View style={styles.row}>
              <Card
                style={styles.flex}
                onPress={() => router.push({ pathname: '/oportunidad/[id]', params: { id: item.id } })}
                accessibilityLabel={`${item.title}. ${meta.label}, ${item.entityName}.${item.deadline ? ` Cierra el ${shortDate(item.deadline)}.` : ''}`}
                accessibilityHint="Abre el detalle de la oportunidad"
              >
                <View style={styles.cardRow}>
                  <View style={[styles.icon, { backgroundColor: tone }]}>
                    <Ionicons name={meta.icon} size={22} color={colors.text} />
                  </View>
                  <View style={styles.flex}>
                    <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[typography.secondary, { color: colors.textMuted }]}>
                      {item.entityName}
                      {item.deadline ? ` · cierra el ${shortDate(item.deadline)}` : ''}
                    </Text>
                  </View>
                </View>
              </Card>
              <SaveButton opportunity={item} />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
