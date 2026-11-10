import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './tokens';

/** Devuelve la paleta según el tema del sistema (claro u oscuro). */
export function useTheme(): { colors: Palette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: palettes[scheme], scheme };
}
