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
| M1 | Motricidad | Objetivos táctiles de al menos 44 × 44, con separación suficiente entre las cuatro o cinco tarjetas | 2.5.8 (AA); la Fase 3 exige 44 pt / 48 dp | `apps/mobile/src/theme/tokens.ts` (`minTouchTarget = 48`, ya existe y se usa en el botón "Reintentar" de `apps/mobile/app/index.tsx`); pendientes `src/components/ui/Button.tsx` y `src/components/OpportunityCard.tsx` | Accessibility Scanner (Android) y Accessibility Inspector; prueba RNTL de tamaño mínimo | En progreso |
| M2 | Motricidad | Navegación completa por teclado y *switch*, sin trampas de foco en modales o filtros | 2.1.1, 2.1.2, 2.4.3 | Modal de step-up y de inscripción de 2FA; orden de foco de cada pantalla | Recorrido con Switch Access (Android) o Control por botón (iOS) y con teclado externo, si está disponible | Pendiente |
| M3 | Motricidad | Sin límites de tiempo estrictos para completar el perfil o revisar recomendaciones | 2.2.1 | Perfil por pasos guardado en el servidor; reemisión transparente de `step_up_token` y renovación silenciosa (decisión 0002) | Dejar el perfil a medias, cerrar la app y retomarlo; dejar vencer el reto de 2FA sin perder la acción | Pendiente |
| V1 | Visión | Contraste mínimo de 4.5:1 en texto y 3:1 en componentes gráficos | 1.4.3, 1.4.11 | `apps/mobile/src/theme/tokens.ts` (paletas clara y oscura de la decisión 0006, ya creadas) | Contrastes calculados en la decisión 0006. Falta la prueba unitaria automatizada y la revisión con Accessibility Scanner | En progreso |
| V2 | Visión | Estado de vigencia (vigente, por cerrar, cerrada) con texto e ícono además de color | 1.4.1 | `src/components/StatusBadge.tsx` | Revisión en escala de grises; prueba RNTL de que el texto existe | Pendiente |
| V3 | Visión | Compatibilidad completa con lectores de pantalla: etiquetas semánticas y texto alternativo en cada oportunidad | 1.1.1, 1.3.1, 4.1.2 | `OpportunityCard.tsx` (tarjeta agrupada con `accessible`, `accessibilityLabel`, `accessibilityRole`), detalle de oportunidad y formularios | Recorrido completo con TalkBack y VoiceOver; consultas RNTL por rol y etiqueta | Pendiente |
| C1 | Cognición | Lenguaje claro al explicar cada oportunidad, sin jerga institucional sin definir | 3.1.5 (AAA; compromiso propio) | Campo `summary_plain` y razones de recomendación en el backend; textos de la UI | Revisión de contenido con una lista de chequeo; prueba con al menos una persona externa al equipo | Pendiente |
| C2 | Cognición | Límite estricto de cuatro a cinco opciones visibles y flujo guiado paso a paso en lugar de formularios largos | 3.3.2; principio de producto | `supabase/functions/_shared/domain/recommendation.ts` (selección de máximo 5, ya implementada; constantes en `constants.ts`); pendientes las pantallas `app/profile/[step].tsx` | Prueba de dominio "devuelve como máximo 5 recomendaciones" en `recommendation.test.ts` (pasa). Falta el recorrido del perfil por pasos | En progreso |
| C3 | Cognición | Guardar el progreso (perfil, filtros y oportunidades vistas) y retomarlo sin perder información | 3.3.7 | `PUT /me/profile` por pasos, `selectProfileCompleteness`, tabla `opportunity_views` | Interrumpir el flujo en cada paso y retomarlo en otra sesión | Pendiente |
| A1 | Audición | Subtítulos o transcripción en todo contenido audiovisual | 1.2.2 | — | — | No aplica mientras el MVP no incluya audio ni video; si se agrega, pasa a Pendiente |
| A2 | Audición | Notificaciones críticas siempre visuales, nunca solo sonoras | 1.3.3, 4.1.3 | Mensajes de estado y error visibles en pantalla, anunciados con `AccessibilityInfo.announceForAccessibility`, y vibración con `expo-haptics` como refuerzo | Recorrido con el teléfono en silencio | Pendiente |
| A3 | Audición | Flujos de ayuda que no dependan solo de instrucciones por voz | 1.3.3 | Textos de ayuda e instrucciones en pantalla | Revisión de que no existen instrucciones solo de audio | Pendiente |

## 2. Requisitos adicionales de la Fase 3 y del diseño de autenticación

| ID | Requisito | Pauta WCAG | Ubicación prevista | Validación prevista | Estado |
|---|---|---|---|---|---|
| F1 | Escalado dinámico de fuentes sin recortes y con `lineHeight` adecuado | 1.4.4, 1.4.12 | `src/components/ui/Text.tsx`, `src/theme/tokens.ts` | Tamaño de fuente máximo del sistema en Android e iOS, revisando cada pantalla | Pendiente |
| F2 | Agrupación de contenedores táctiles para evitar foco fragmentado | 1.3.1, 2.4.3 | `OpportunityCard.tsx`, filas de formulario | Recorrido con lector: cada tarjeta se anuncia como una sola unidad | Pendiente |
| F3 | Retroalimentación clara ante errores y estados de carga, vacío, error y reintento | 3.3.1, 4.1.3 | Patrón inicial en `apps/mobile/app/index.tsx`: carga, éxito y error con reintento; anuncio con `AccessibilityInfo.announceForAccessibility`; botón con `accessibilityState` `busy`/`disabled` que se mantiene montado para no perder el foco. Pendiente extraerlo a componentes de estado reutilizables. | Simular red caída y respuestas vacías; verificar anuncios del lector (no ejecutado aún en dispositivo) | En progreso |
| F4 | `hitSlop` donde un elemento visual sea menor que el área táctil mínima | 2.5.8 | Íconos de acción | Accessibility Scanner | Pendiente |
| S1 | Autenticación accesible: el código TOTP admite pegar y autocompletar, con teclado numérico | 3.3.8 | Campo de código del modal de step-up (`oneTimeCode` / `one-time-code`) | Pegar un código desde la app autenticadora con el lector activo | Pendiente |

## 3. Diferencias de criterio registradas

- La Fase 2 expresa los objetivos táctiles en "44 × 44 px". La Fase 3 exige 44 × 44 pt (iOS) o 48 × 48 dp (Android). Se adopta un mínimo de **48** unidades independientes de densidad en ambas plataformas, que cumple los dos.
- La Fase 2 menciona "modales de postulación o filtros". Orienta+ no tiene postulación interna, porque la postulación ocurre en el canal oficial. El compromiso M2 se aplica a los modales que sí existen: verificación 2FA, inscripción de 2FA y confirmaciones de acciones críticas.

## 4. Registro de auditorías en dispositivo

| Fecha | Dispositivo y sistema | Lector o herramienta | Recorrido probado | Hallazgo | Responsable | Estado |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |
