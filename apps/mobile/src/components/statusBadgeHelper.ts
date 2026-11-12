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

/** Texto visible de la vigencia ("Vigente", "Cierra en 3 días", …). */
export function validityText(validity: ValidityKind): string {
  if (validity.kind === 'closed') return 'Convocatoria cerrada';
  if (validity.kind === 'closing_soon') {
    if (validity.daysLeft <= 0) return 'Cierra hoy';
    return `Cierra en ${validity.daysLeft} ${validity.daysLeft === 1 ? 'día' : 'días'}`;
  }
  return 'Vigente';
}

/**
 * Lo que anuncia el lector de pantalla sobre la vigencia. No depende de los
 * colores, así que también lo usan los componentes que agrupan el badge
 * dentro de otra etiqueta (OpportunityCard).
 */
export function validityLabel(validity: ValidityKind): string {
  if (validity.kind === 'closed') return 'Convocatoria cerrada';
  if (validity.kind === 'closing_soon') return `Atención: ${validityText(validity)}`;
  return 'Convocatoria vigente';
}

/**
 * Calcula las propiedades visuales y accesibles del badge.
 * Extraído como lógica pura para pruebas unitarias sin dependencias de UI.
 */
export function getStatusBadgeVisual(
  validity: ValidityKind,
  colors: Palette,
): BadgeVisual {
  const text = validityText(validity);
  const label = validityLabel(validity);

  if (validity.kind === 'closed') {
    return {
      icon: '✕',
      text,
      label,
      backgroundColor: colors.surface,
      textColor: colors.danger,
      borderColor: colors.danger,
    };
  }

  if (validity.kind === 'closing_soon') {
    return {
      icon: '⚠',
      text,
      label,
      backgroundColor: colors.surface,
      textColor: colors.warning,
      borderColor: colors.warning,
    };
  }

  return {
    icon: '✓',
    text,
    label,
    backgroundColor: colors.surface,
    textColor: colors.success,
    borderColor: colors.success,
  };
}
