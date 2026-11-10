import { type Palette } from '../theme/tokens';

export type ValidityKind =
  | { kind: 'open' }
  | { kind: 'closing_soon'; daysLeft: number }
  | { kind: 'closed' };

export interface BadgeVisual {
  label: string;
  icon: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

/**
 * Calcula las propiedades visuales y accesibles del badge.
 * Extraído como lógica pura para pruebas unitarias sin dependencias de UI.
 */
export function getStatusBadgeVisual(
  validity: ValidityKind,
  colors: Palette,
): BadgeVisual {
  if (validity.kind === 'closed') {
    return {
      icon: '✕',
      text: 'Convocatoria cerrada',
      label: 'Convocatoria cerrada',
      backgroundColor: colors.surface,
      textColor: colors.danger,
      borderColor: colors.danger,
    };
  }

  if (validity.kind === 'closing_soon') {
    const isToday = validity.daysLeft <= 0;
    const text = isToday
      ? 'Cierra hoy'
      : `Cierra en ${validity.daysLeft} ${validity.daysLeft === 1 ? 'día' : 'días'}`;
    return {
      icon: '⚠',
      text,
      label: `Atención: ${text}`,
      backgroundColor: colors.surface,
      textColor: colors.warning,
      borderColor: colors.warning,
    };
  }

  return {
    icon: '✓',
    text: 'Vigente',
    label: 'Convocatoria vigente',
    backgroundColor: colors.surface,
    textColor: colors.success,
    borderColor: colors.success,
  };
}
