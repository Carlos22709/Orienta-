import { useColorScheme } from 'react-native';
import { useAppSelector } from '../store';
import { selectSettings } from '../store/settingsSlice';
import { categoryTones, palettes, type Palette } from './tokens';

type CategoryTones = { [K in keyof (typeof categoryTones)['light']]: string };

/**
 * Paleta vigente: la que elija la persona en Accesibilidad (claro u oscuro) o
 * la del sistema. Al depender de los ajustes, cualquier cambio de tema o de
 * tamaño de texto vuelve a dibujar las pantallas que usan este hook.
 */
export function useTheme(): {
  colors: Palette;
  categories: CategoryTones;
  scheme: 'light' | 'dark';
  textScale: number;
} {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { theme, textScale } = useAppSelector(selectSettings);
  const scheme = theme === 'system' ? system : theme;
  return { colors: palettes[scheme], categories: categoryTones[scheme], scheme, textScale };
}
