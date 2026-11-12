# Sección 3: Implementación y auditoría de accesibilidad móvil

**Autora:** Laura Vanesa Reyes Martínez
**Rol en el proyecto:** Perfil, diseño accesible y trazabilidad
**Estado:** borrador, actualizado al diseño "Amanecer" del 2026-11-12. Cada afirmación cita el archivo donde se puede comprobar. Las rutas son relativas a `apps/mobile/` salvo que se indique otra cosa. La evidencia fila por fila está en `docs/accessibility/matriz-trazabilidad.md`.

---

## 3.1 Enfoque

Orienta+ toma como referencia las pautas WCAG 2.2 nivel AA [1], adaptadas a una aplicación React Native [2]. Los compromisos de la Fase 2 se organizaron por tipo de discapacidad: motricidad (M), visión (V), cognición (C) y audición (A). A ellos se sumaron los requisitos de la Fase 3 y los ajustes de accesibilidad agregados al producto (F). Cada compromiso tiene un identificador que se usa en el código, en la matriz y en este documento.

Hay cuatro reglas que aplican a toda la interfaz:

1. **Ningún color se escribe directamente en un componente.** Todos salen de `src/theme/tokens.ts`, y una prueba automatizada comprueba sus contrastes.
2. **Ningún estado depende solo del color.** Vigencia, selección, error y éxito combinan texto, ícono y color.
3. **Todo elemento táctil mide al menos `minTouchTarget` (48).**
4. **Todo aviso importante llega por más de un canal:** se ve en pantalla, el lector de pantalla lo anuncia y, de forma opcional, el teléfono vibra.

La Fase 2 expresaba los objetivos táctiles en "44 × 44 px", mientras que la Fase 3 exige 44 × 44 pt en iOS [3] o 48 × 48 dp en Android [4]. Se adoptó un mínimo único de **48 unidades independientes de densidad**, que cumple ambos.

## 3.2 Semántica para lectores de pantalla (VoiceOver y TalkBack)

### Propiedades nativas utilizadas

| Propiedad | Uso en Orienta+ | Ejemplo |
|---|---|---|
| `accessibilityRole` | `header` en títulos y preguntas; `button`; `link`; `radio`, `radiogroup` y `checkbox` en el cuestionario; `progressbar` en el avance del cuestionario; `adjustable` en el control de tamaño de texto | `src/components/OptionGroup.tsx`, `src/ui/layout.tsx` (`ProgressBar`), `app/accesibilidad.tsx` |
| `accessibilityLabel` y `accessibilityHint` | Qué es el control y qué pasará al activarlo, cuando el texto visible no basta | `src/components/OpportunityCard.tsx`, `src/components/CodeInput.tsx` ("Escríbelo o pégalo desde tu app autenticadora") |
| `accessibilityState` | `checked` en opciones y consentimiento; `selected` en filtros; `busy` y `disabled` en botones mientras algo se procesa | `src/components/OptionGroup.tsx`, `src/ui/Button.tsx`, `app/(tabs)/explorar.tsx` |
| `accessibilityValue` y `accessibilityActions` | El control de tamaño de texto anuncia el porcentaje y se ajusta deslizando hacia arriba o hacia abajo con el lector | `app/accesibilidad.tsx` |
| `accessible` (agrupación) | Une varios textos en un solo foco | `OpportunityCard.tsx`, `Card` y `MenuRow` en `src/ui/layout.tsx`, `Fact` en `app/oportunidad/[id].tsx` |
| `accessibilityViewIsModal` | VoiceOver no puede salir del modal de verificación en dos pasos hasta cerrarlo | `src/components/StepUpModal.tsx` |
| `accessibilityLiveRegion` y `announceForAccessibility` | Anuncian cambios que no mueven el foco: errores de campo, número de resultados de búsqueda, paso del cuestionario, carga y error | `OptionGroup.tsx`, `app/(tabs)/explorar.tsx`, `app/cuestionario.tsx`, `src/ui/feedback.ts` |

### Agrupación de contenedores táctiles (F2)

En `OpportunityCard`, la zona principal de cada recomendación es un único `Pressable` con `accessible`, que el lector recorre como **un solo foco**. Su etiqueta incluye título, vigencia, categoría, modalidad, entidad y razones de la recomendación, y su pista dice que se abrirá el detalle (`buildOpportunityLabel`). El botón de guardar (♡, `src/components/SaveButton.tsx`) queda **fuera** del grupo y es un control separado. Si estuviera dentro, no se podría activar con el lector.

Sin esta agrupación, cada texto de la tarjeta sería un foco distinto, y la persona tendría que deslizar varias veces por cada oportunidad.

### Cuestionario de perfil

El cuestionario (`app/cuestionario.tsx`) muestra **una pregunta por pantalla**:

- Una barra de progreso (`accessibilityRole="progressbar"`) indica el avance.
- Al cambiar de paso se anuncia, por ejemplo, "Paso 3 de 8. ¿Cuál es tu nivel de estudios?".
- Las preguntas de opción usan `OptionGroup` (`src/components/OptionGroup.tsx`): la pregunta es un **encabezado** y las opciones son `radio` dentro de un `radiogroup`, o `checkbox` cuando se pueden elegir varias. El estado `checked` hace que el lector diga "marcado" o "no marcado".
- La fecha de nacimiento usa el **selector nativo** de cada sistema (`@react-native-community/datetimepicker`), que VoiceOver y TalkBack ya saben operar. La fecha elegida se resume en un solo foco: "Fecha elegida: … Tienes N años".
- Los errores del servidor (HTTP 422) se muestran junto a la pregunta, con ícono y texto, y se anuncian. La lógica que interpreta esos errores está en `src/profile/profileForm.ts` (`readSaveProfileError`) y tiene pruebas en `profileForm.test.ts`.

## 3.3 Diseño visual, contraste y tipografía

### Contraste verificado (V1)

La prueba `src/theme/tokens.test.ts` calcula el contraste de cada color con la fórmula de luminancia relativa de WCAG [1] y falla si algún texto queda por debajo de 4.5:1 o algún componente gráfico por debajo de 3:1. Los valores de la tabla se calcularon sobre los colores vigentes de `tokens.ts` (fondo / superficie).

| Token | Tema claro | Tema oscuro | Mínimo |
|---|---|---|---|
| `text` | 14.40 / 15.15 | 16.62 / 14.76 | 4.5:1 |
| `textMuted` | 7.06 / 7.43 | 10.18 / 9.04 | 4.5:1 |
| `primary` (enlaces y botones) | 4.92 / 5.18 | 8.82 / 7.83 | 4.5:1 |
| `onPrimary` sobre `primary` | 5.18 | 7.28 | 4.5:1 |
| `success` / `warning` / `danger` | 5.11 / 6.02 / 6.21 (fondo) | 9.79 / 10.67 / 8.33 (fondo) | 4.5:1 |
| `chipText` sobre `chip` | 6.14 | 8.35 | 4.5:1 |
| `border` (componentes) | 3.85 / 4.05 | 3.98 / 3.53 | 3:1 |

El margen más estrecho es `primary` sobre el fondo claro (4.92:1). Cualquier ajuste de ese color debe volver a pasar la prueba.

### Tema elegible (F5)

En la pantalla **Accesibilidad** (`app/accesibilidad.tsx`), la persona elige "Según el teléfono", "Claro" u "Oscuro". La preferencia tiene prioridad sobre la del sistema (`src/theme/useTheme.ts`) y se guarda en el teléfono (`src/settings/persistence.ts`). El tema oscuro sirve a personas con sensibilidad al brillo.

### Información que no depende solo del color (V2)

- **Vigencia:** `StatusBadge` combina un ícono vectorial distinto por estado con el texto "Vigente", "Cierra en N días" o "Convocatoria cerrada" (`src/components/statusBadgeHelper.ts`, probado en `StatusBadge.test.ts`).
- **Selección:** las opciones del cuestionario muestran un ícono de radio o de casilla, marcado o vacío, además del cambio de color.
- **Errores y avisos:** siempre llevan ícono y un texto que explica qué pasó y qué hacer (`Notice` en `src/ui/layout.tsx`).

### Tipografía adaptativa y prevención de recortes (F1)

- **Interlineado:** cada estilo de `BASE_TYPOGRAPHY` (`src/theme/tokens.ts`) define un `lineHeight` de unas 1.5 veces el tamaño en el cuerpo (16/24) y 1.25 en los títulos (26/33).
- **Tamaño ajustable dentro de la app:** va de 85 % a 160 %, en pasos de 5 %, desde la pantalla Accesibilidad. `scaleTypography` multiplica tamaño y `lineHeight` juntos, así que la proporción se mantiene y el texto no se recorta. La prueba `src/theme/textScale.test.ts` lo comprueba.
- **Escalado del sistema activo:** este ajuste se suma al tamaño de letra de Android o iOS, que no se desactiva. La única excepción es el avatar de tamaño fijo de `app/(tabs)/perfil.tsx`, que limita su texto con `maxFontSizeMultiplier={1.3}`.
- **Sin alturas fijas:** los contenedores de texto usan `minHeight`, de modo que crecen con el texto.

## 3.4 Ergonomía táctil, navegación y retroalimentación

### Áreas táctiles (M1, F4)

| Elemento | Altura mínima | Archivo |
|---|---|---|
| Botones (`Button`) | 52 | `src/ui/Button.tsx` |
| Opciones del cuestionario | 56 | `src/components/OptionGroup.tsx` |
| Filas de menú (`MenuRow`) | 56 | `src/ui/layout.tsx` |
| Botón de guardar (♡) | 48 × 48 | `src/components/SaveButton.tsx` |

`hitSlop` amplía el área táctil donde el ícono visible es pequeño:

- botón "Atrás" (`BackButton`, 8);
- "volver" del cuestionario (8);
- "Borrar búsqueda" en Explorar (10);
- ♡ (6).

### Navegación y foco (M2)

- El orden de lectura sigue el orden visual y no se alteró.
- Cada pantalla empieza con un título marcado como encabezado (`accessibilityRole="header"`, en `ScreenHeader` de `src/ui/layout.tsx` o directamente en la pantalla), lo que permite saltar al contenido.
- La navegación principal son cuatro pestañas con ícono y texto: Para ti, Explorar, Guardadas y Perfil (`app/(tabs)/_layout.tsx`).
- El modal de verificación en dos pasos retiene el foco (`accessibilityViewIsModal`), responde al botón Atrás de Android (`onRequestClose`) y siempre muestra "Cancelar". Así se evitan las trampas de foco.

### Retroalimentación multisensorial (F3, A2, F7)

`src/ui/feedback.ts` centraliza los avisos (`notifySuccess`, `notifyError`, `notifyWarning`, `notifySelection`). Cada aviso:

1. aparece como texto en pantalla;
2. se anuncia al lector;
3. produce una vibración breve con `expo-haptics`.

La vibración se puede apagar en Accesibilidad (`Switch` con etiqueta). Si se apaga, los otros dos canales siguen funcionando.

Los estados de carga, vacío y error (`src/components/states/`) se usan en Para ti, Explorar, el detalle, Vistas y el cuestionario. Si faltan datos del perfil (`409 profile_incomplete`), Para ti lo explica y ofrece "Terminar cuestionario", en lugar de mostrar un error de conexión (`app/(tabs)/para-ti.tsx`).

### Sin límites de tiempo y con progreso guardado (M3, C3)

- **Borrador en el teléfono:** el cuestionario se guarda mientras se responde (`src/profile/draft.ts`). Si la persona cierra la app, al volver retoma donde iba y se le anuncia "Retomamos tus respuestas donde ibas".
- **Perfil en el servidor:** se guarda con `PUT /me/profile` y se puede editar desde Perfil.
- **Guardadas en el servidor:** las oportunidades marcadas con el ♡ se guardan con `PUT /me/saved/:id`. Siguen ahí al cerrar sesión o al entrar desde otro teléfono, y solo se borran al eliminar la cuenta.
- **Código de 2FA vencido:** si vence el reto de verificación en dos pasos, se pide otro código sin perder la acción en curso (`src/security/criticalAction.ts`).

### Lectura en voz alta (F6)

El botón **Escuchar** del detalle (`src/components/ListenButton.tsx`) lee la oportunidad completa con `expo-speech`, con voz en español, y se detiene al salir de la pantalla. El texto lo arma `src/a11y/speechText.ts` en el mismo orden de la pantalla.

Es un compromiso propio, que va más allá de WCAG: ayuda a personas con baja visión o con dificultades de lectura que no usan un lector de pantalla.

## 3.5 Matriz trazable: propuesta de la Fase 2 frente a la implementación

La columna "Tipo de evidencia" distingue entre **prueba automatizada** (Jest o Deno), **dispositivo** (auditoría registrada en un teléfono) y **revisión** (inspección del código). Varios compromisos figuran como "Validado" en la matriz solo con pruebas automatizadas. Su comportamiento en un teléfono con el diseño actual todavía debe confirmarse (ver 3.6, H3).

| ID | Compromiso | Implementación (archivo) | Tipo de evidencia | Estado en la matriz |
|---|---|---|---|---|
| M1 | Objetivos táctiles amplios | `tokens.ts`, `Button.tsx`, `OptionGroup.tsx`, `layout.tsx`, `SaveButton.tsx` | Revisión; dispositivo con el diseño anterior | Implementado |
| M2 | Sin trampas de foco | `StepUpModal.tsx` | Revisión | Implementado |
| M3 | Sin límites de tiempo | `draft.ts`, `criticalAction.ts` | Prueba automatizada | Validado |
| V1 | Contraste AA | `tokens.ts` | Prueba automatizada (`tokens.test.ts`, `amanecer.test.ts`) | Validado |
| V2 | Vigencia y selección sin depender del color | `StatusBadge.tsx`, `OptionGroup.tsx` | Prueba automatizada | Validado |
| V3 | Semántica para lectores | `OpportunityCard.tsx`, `OptionGroup.tsx`, `app/oportunidad/[id].tsx` | Prueba automatizada; dispositivo con el diseño anterior | Implementado |
| C1 | Lenguaje claro | `supabase/seed.sql`, `app/cuestionario.tsx`, `app/como-funciona.tsx` | Revisión | Implementado |
| C2 | Cuatro a cinco opciones y flujo guiado | `recommendation.ts` (backend), `para-ti.tsx`, `cuestionario.tsx` | Prueba automatizada | Validado |
| C3 | Guardar el progreso | `draft.ts`, `PUT /me/profile`, `GET /me/views` | Prueba automatizada | Validado |
| A1 | Subtítulos | — | — | No aplica: el MVP no tiene audio ni video |
| A2 | Avisos no solo sonoros | `src/ui/feedback.ts` | Revisión | Implementado |
| A3 | Ayuda no solo por voz | `cuestionario.tsx`, `como-funciona.tsx`, `Notice` | Revisión | Implementado |
| F1 | Escalado de texto sin recortes | `tokens.ts` (`scaleTypography`), `app/accesibilidad.tsx` | Prueba automatizada | Validado (falta revisión visual) |
| F2 | Agrupación de focos | `OpportunityCard.tsx`, `layout.tsx` | Dispositivo con el diseño anterior | Implementado |
| F3 | Estados de carga, vacío y error | `src/components/states/`, `para-ti.tsx` | Prueba automatizada | Validado |
| F4 | `hitSlop` | `layout.tsx`, `cuestionario.tsx`, `explorar.tsx`, `SaveButton.tsx` | Revisión | Implementado |
| F5 | Tema elegible | `accesibilidad.tsx`, `settingsSlice.ts`, `useTheme.ts` | Prueba automatizada | Validado |
| F6 | Lectura en voz alta | `ListenButton.tsx`, `speechText.ts` | Prueba automatizada | Validado |
| F7 | Vibración opcional | `accesibilidad.tsx`, `feedback.ts` | Prueba automatizada | Implementado |
| S1 | Código de 2FA accesible | `CodeInput.tsx`; `totp.ts` (backend) | Prueba automatizada | Validado |

## 3.6 Hallazgos de la revisión

La revisión del código para esta sección encontró los siguientes puntos. Se registran para que el documento no afirme más de lo que el producto hace.

| # | Hallazgo | Impacto | Corrección | Estado |
|---|---|---|---|---|
| H1 | `ErrorState` y `EmptyState` marcaban todo su contenedor con `accessible`, y el botón "Reintentar" o de acción quedaba dentro. En iOS, un elemento `accessible` oculta a sus hijos. | VoiceOver no podía llegar al botón: una persona ciega no podía reintentar tras un error de red. | Solo el ícono, el título y el mensaje forman el grupo; el botón quedó como elemento hermano (`src/components/states/ErrorState.tsx`, `EmptyState.tsx`). | Corregido en el código. Falta confirmarlo con VoiceOver |
| H2 | La etiqueta de `OpportunityCard` no incluía la vigencia. Como la tarjeta agrupa a sus hijos, el lector no leía el `StatusBadge`. | Quien usa lector no se enteraba de que una convocatoria "cierra en 2 días" (V2). | `buildOpportunityLabel` agrega la vigencia justo después del título, con `validityLabel` de `statusBadgeHelper.ts`. | Corregido y probado en `OpportunityCard.test.ts`. Falta confirmarlo con lector |
| H3 | Las auditorías en dispositivo registradas (10-nov) son del diseño anterior. Las del diseño actual siguen "Pendiente": VoiceOver en iOS y TalkBack con Accessibility Scanner en Android. | M1, V3, F1 y F2 no tienen evidencia en dispositivo con las pantallas actuales, y H1 y H2 están corregidos sin confirmar. | Ejecutar ambas auditorías con el recorrido completo y registrar los hallazgos en `docs/accessibility/matriz-trazabilidad.md`, sección 4. | Abierto |

## Referencias

[1] W3C, "Web Content Accessibility Guidelines (WCAG) 2.2," W3C Recommendation, 2023. [En línea]. Disponible: https://www.w3.org/TR/WCAG22/

[2] Meta Platforms, "Accessibility," *React Native Documentation*. [En línea]. Disponible: https://reactnative.dev/docs/accessibility

[3] Apple Inc., "Accessibility," *Human Interface Guidelines*. [En línea]. Disponible: https://developer.apple.com/design/human-interface-guidelines/accessibility

[4] Google, "Make apps more accessible," *Android Developers*. [En línea]. Disponible: https://developer.android.com/guide/topics/ui/accessibility/apps
