import { useColorScheme } from 'react-native';
import { categoryTones, palettes, type Palette } from './tokens';

type CategoryTones = { [K in keyof (typeof categoryTones)['light']]: string };

/** Devuelve la paleta según el tema del sistema (claro u oscuro). */
export function useTheme(): {
  colors: Palette;
  categories: CategoryTones;
  scheme: 'light' | 'dark';
} {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: palettes[scheme], categories: categoryTones[scheme], scheme };
}
