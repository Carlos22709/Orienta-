# Matriz de trazabilidad de accesibilidad

- **Fuente de los compromisos:** documento de las Fases 1 y 2, sección IV "Accesibilidad e inclusión digital" y Tabla II (`main.pdf`, entregado por el equipo).
- **Requisitos adicionales:** enunciado de la Fase 3, sección 3.
- **Estado de la matriz:** línea base. Ningún compromiso está implementado todavía.

  Las columnas "Ubicación prevista" y "Validación prevista" son planes, no evidencia. Al implementar, cada fila se actualiza con:
  - la ruta exacta del archivo;
  - la prueba ejecutada;
  - el dispositivo;
  - el resultado observado.

Estados: `Pendiente` · `En progreso` · `Implementado` · `Validado` · `No aplica (justificado)`.

## 1. Compromisos de la Fase 2

| ID | Categoría | Compromiso (Fase 2) | Pauta WCAG | Ubicación prevista | Validación prevista | Estado |
|---|---|---|---|---|---|---|
| M1 | Motricidad | Objetivos táctiles de al menos 44 × 44, con separación suficiente entre las cuatro o cinco tarjetas | 2.5.8 (AA); la Fase 3 exige 44 pt / 48 dp | `apps/mobile/src/theme/tokens.ts` (`minTouchTarget = 48`), `src/components/OpportunityCard.tsx` (separación `spacing.md = 12` y altura mínima 48), `app/recommendations/index.tsx` | Verificación de tokens y estilos; prueba unitaria de tamaños y separación | Implementado |
| M2 | Motricidad | Navegación completa por teclado y *switch*, sin trampas de foco en modales o filtros | 2.1.1, 2.1.2, 2.4.3 | Modal de step-up y de inscripción de 2FA; orden de foco de cada pantalla | Recorrido con Switch Access (Android) o Control por botón (iOS) y con teclado externo, si está disponible | Pendiente |
| M3 | Motricidad | Sin límites de tiempo estrictos para completar el perfil o revisar recomendaciones | 2.2.1 | Perfil por pasos guardado en el servidor; reemisión transparente de `step_up_token` y renovación silenciosa (decisión 0002) | Dejar el perfil a medias, cerrar la app y retomarlo; dejar vencer el reto de 2FA sin perder la acción | Pendiente |
| V1 | Visión | Contraste mínimo de 4.5:1 en texto y 3:1 en componentes gráficos | 1.4.3, 1.4.11 | `apps/mobile/src/theme/tokens.ts` (paletas clara y oscura) | `apps/mobile/src/theme/tokens.test.ts` automatiza el cálculo de luminancia y valida >= 4.5:1 en todos los textos y >= 3.0:1 en bordes | Validado |
| V2 | Visión | Estado de vigencia (vigente, por cerrar, cerrada) con texto e ícono además de color | 1.4.1 | `apps/mobile/src/components/StatusBadge.tsx` y `statusBadgeHelper.ts` | `apps/mobile/src/components/StatusBadge.test.ts` valida textos ('Vigente', 'Cierra en N días', 'Cerrada'), íconos (✓, ⚠, ✕) y colores | Validado |
| V3 | Visión | Compatibilidad completa con lectores de pantalla: etiquetas semánticas y texto alternativo en cada oportunidad | 1.1.1, 1.3.1, 4.1.2 | `apps/mobile/src/components/OpportunityCard.tsx` (tarjeta agrupada con `accessible`, `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`), `app/opportunity/[id].tsx` | Inspección de árbol semántico y anuncios integrados | Implementado |
| C1 | Cognición | Lenguaje claro al explicar cada oportunidad, sin jerga institucional sin definir | 3.1.5 (AAA; compromiso propio) | Campo `summary_plain`, razones de recomendación en backend y seed; `OpportunityCard.tsx` y detalle `app/opportunity/[id].tsx` | Revisión de texto de convocatorias curadas por Juan en `seed.sql` | Implementado |
| C2 | Cognición | Límite estricto de cuatro a cinco opciones visibles y flujo guiado paso a paso en lugar de formularios largos | 3.3.2; principio de producto | Backend `recommend.ts`, frontend `app/recommendations/index.tsx` (FlatList optimizada que renderiza de 4 a 5 recomendaciones) | Prueba de dominio en backend y visualización en lista móvil | Implementado |
| C3 | Cognición | Guardar el progreso (perfil, filtros y oportunidades vistas) y retomarlo sin perder información | 3.3.7 | `PUT /me/profile` por pasos, `selectProfileCompleteness`, tabla `opportunity_views` | Interrumpir el flujo en cada paso y retomarlo en otra sesión | Pendiente |
| A1 | Audición | Subtítulos o transcripción en todo contenido audiovisual | 1.2.2 | — | — | No aplica mientras el MVP no incluya audio ni video; si se agrega, pasa a Pendiente |
| A2 | Audición | Notificaciones críticas siempre visuales, nunca solo sonoras | 1.3.3, 4.1.3 | Mensajes de estado y error visibles en pantalla, anunciados con `AccessibilityInfo.announceForAccessibility`, y vibración con `expo-haptics` como refuerzo | Recorrido con el teléfono en silencio | Pendiente |
| A3 | Audición | Flujos de ayuda que no dependan solo de instrucciones por voz | 1.3.3 | Textos de ayuda e instrucciones en pantalla | Revisión de que no existen instrucciones solo de audio | Pendiente |

## 2. Requisitos adicionales de la Fase 3 y del diseño de autenticación

| ID | Requisito | Pauta WCAG | Ubicación prevista | Validación prevista | Estado |
|---|---|---|---|---|---|
| F1 | Escalado dinámico de fuentes sin recortes y con `lineHeight` adecuado | 1.4.4, 1.4.12 | `src/components/ui/Text.tsx`, `src/theme/tokens.ts` | Tamaño de fuente máximo del sistema en Android e iOS, revisando cada pantalla | Pendiente |
| F2 | Agrupación de contenedores táctiles para evitar foco fragmentado | 1.3.1, 2.4.3 | `apps/mobile/src/components/OpportunityCard.tsx` | Recorrido con lector: cada tarjeta se anuncia como una sola unidad con su rol y pista de acción | Implementado |
| F3 | Retroalimentación clara ante errores y estados de carga, vacío, error y reintento | 3.3.1, 4.1.3 | `apps/mobile/src/components/states/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`; usados en `app/recommendations/index.tsx` y `app/opportunity/[id].tsx` | Anuncios con `AccessibilityInfo.announceForAccessibility`, estados `busy`/`disabled` y foco persistente en reintento | Implementado |
| F4 | `hitSlop` donde un elemento visual sea menor que el área táctil mínima | 2.5.8 | Íconos de acción | Accessibility Scanner | Pendiente |
| S1 | Autenticación accesible: el código TOTP admite pegar y autocompletar, con teclado numérico | 3.3.8 | Backend: `supabase/functions/_shared/security/totp.ts` (`verifyTotp` acepta el código pegado con espacios, ya implementado). Pendiente: campo de código del modal de step-up (`oneTimeCode` / `one-time-code`) | Prueba "verifyTotp acepta un código pegado con espacios" en `totp.test.ts` (pasa). Pendiente: pegar un código desde la app autenticadora con el lector activo | En progreso |

## 3. Diferencias de criterio registradas

- La Fase 2 expresa los objetivos táctiles en "44 × 44 px". La Fase 3 exige 44 × 44 pt (iOS) o 48 × 48 dp (Android). Se adopta un mínimo de **48** unidades independientes de densidad en ambas plataformas, que cumple los dos.
- La Fase 2 menciona "modales de postulación o filtros". Orienta+ no tiene postulación interna, porque la postulación ocurre en el canal oficial. El compromiso M2 se aplica a los modales que sí existen: verificación 2FA, inscripción de 2FA y confirmaciones de acciones críticas.

## 4. Registro de auditorías en dispositivo

| Fecha | Dispositivo y sistema | Lector o herramienta | Recorrido probado | Hallazgo | Responsable | Estado |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |
