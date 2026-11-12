import type { Ionicons } from '@expo/vector-icons';
import type { CategoryKey } from '../theme/tokens';

/** Categorías de oportunidad con su nombre en lenguaje claro y su ícono. */
export const CATEGORIES: ReadonlyArray<{
  key: CategoryKey;
  label: string;
  plural: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'employment', label: 'Empleo', plural: 'Empleo', icon: 'briefcase' },
  { key: 'training', label: 'Formación', plural: 'Formación', icon: 'book' },
  { key: 'scholarship', label: 'Beca', plural: 'Becas', icon: 'school' },
  { key: 'subsidy', label: 'Subsidio', plural: 'Subsidios', icon: 'home' },
  { key: 'entrepreneurship', label: 'Emprendimiento', plural: 'Emprender', icon: 'rocket' },
];

export function categoryMeta(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

export function isCategoryKey(key: string): key is CategoryKey {
  return CATEGORIES.some((c) => c.key === key);
}
