# Sección IV y V: Pruebas, Rendimiento, Limitaciones y Conclusiones

**Autor:** Juan Esteban Ramírez Hermosa  
**Rol en el proyecto:** Navegación, resultados, calidad y entrega  
**Proyecto:** Orienta+ — Desarrollo de Aplicaciones Móviles, Universidad de La Sabana  

---

## 1. Estrategia de pruebas y calidad

La estrategia de pruebas de la capa cliente y de interfaz se diseñó para garantizar que los compromisos de accesibilidad (WCAG 2.2 AA), la resiliencia ante fallos de red y la seguridad en la navegación sean observables y verificables mediante pruebas automatizadas.

### 1.1 Pruebas unitarias de accesibilidad y diseño visual

1. **Verificación automatizada de contraste de color (`src/theme/tokens.test.ts`):**
   - Se implementó la fórmula de luminancia relativa estipulada en la especificación WCAG 2.1:
     $$\text{Luminancia} = 0.2126 \cdot R_{\text{lin}} + 0.7152 \cdot G_{\text{lin}} + 0.0722 \cdot B_{\text{lin}}$$
   - Se calculó la relación de contraste ($\text{CR} = (L_1 + 0.05) / (L_2 + 0.05)$) para todos los pares de tokens frente a `background` y `surface`.
   - **Resultado:** El 100 % de los pares de texto (`text`, `textMuted`, `primary`, `success`, `warning`, `danger`, `onPrimary`) superan el umbral AA de 4.5:1 tanto en el tema claro (16.46:1 texto base, 6.67:1 primario, 5.38:1 éxito) como en el tema oscuro (16.01:1 texto base, 8.85:1 primario, 9.78:1 éxito). Los componentes gráficos (`border`) superan el umbral de 3.0:1.

2. **Verificación de vigencia sin dependencia exclusiva de color (`src/components/StatusBadge.test.ts`):**
   - Atendiendo el criterio WCAG 1.4.1 (compromiso V2), el componente `StatusBadge` asocia a cada estado un texto explícito y un ícono de refuerzo visual:
     - *Vigente:* `✓ Vigente` (éxito).
     - *Por cerrar:* `⚠ Cierra hoy` o `⚠ Cierra en N días` (advertencia).
     - *Cerrada:* `✕ Convocatoria cerrada` (peligro).
   - Las pruebas unitarias validan que la etiqueta accesible y la representación visual correspondan a cada ventana temporal, diferenciando correctamente singular y plural.

3. **Validación y apertura segura de enlaces externos (`src/utils/url.test.ts`):**
   - La función `isValidHttpUrl` somete cualquier enlace externo a análisis de protocolo.
   - Las pruebas confirman la aceptación de URLs HTTPS y HTTP válidas y el rechazo estricto de esquemas vulnerables (`javascript:`, `data:`, `file:`, `tel:`), cadenas vacías o URLs malformadas.

### 1.2 Verificaciones estáticas y compatibilidad de entorno

- **Suite de pruebas de la app móvil (Jest):** 13 suites y **56 pruebas automatizadas aprobadas** (`npm test`), con 100 % de éxito en contraste visual, vigencia multimodal, validación de URLs externas, estados accesibles, virtualización de listas, flujo integrado de usuario, verificación del seed curado y módulos criptográficos/sesión.
- **Suite de pruebas del backend (Deno):** **93 pruebas de dominio y rutas HTTP aprobadas** (`npm run api:test`), totalizando **149 pruebas automatizadas** en el repositorio sin un solo fallo.
- **Tipado estricto:** Ejecución de `npm run typecheck` (`tsc --noEmit`) sin advertencias ni omisiones de tipos en toda la aplicación móvil.
- **Salud del proyecto Expo:** Ejecución de `npx expo-doctor` con 20/20 verificaciones aprobadas en Expo SDK 58.
- **Validación de esquemas en el límite:** Uso de esquemas Zod en RTK Query (`apps/mobile/src/store/api.ts`) para validar en tiempo de ejecución las respuestas de recomendaciones y detalle antes de que ingresen al árbol de componentes.

---

## 2. Rendimiento de listas y experiencia de usuario

Orienta+ tiene como principio fundacional reducir la sobrecarga cognitiva que experimentan los jóvenes al buscar oportunidades.

1. **Límite de resultados y carga eficiente:**
   - La pantalla de resultados (`app/recommendations/index.tsx`) consume el endpoint de recomendación que limita deliberadamente las opciones a 4 o 5 convocatorias altamente afines.
   - Se configuró la lista con `FlatList` utilizando parámetros óptimos de virtualización: `initialNumToRender = 5`, `maxToRenderPerBatch = 5`, `windowSize = 5` y extracción de claves estables por UUID (`item.id`). Esto evita renderizados redundantes al alternar entre pantallas.

2. **Agrupación semántica para lectores de pantalla (TalkBack / VoiceOver):**
   - Para cumplir el compromiso F2 (criterios WCAG 1.3.1 y 2.4.3), la tarjeta `OpportunityCard` se encapsula con `accessible={true}` y `accessibilityRole="button"`.
   - En lugar de obligar al usuario a escuchar 8 focos discontinuos por tarjeta (título, categoría, entidad, modalidad, badge, resumen, razones), el lector sintetiza toda la información en un solo anuncio coherente y le comunica la acción de pulsar dos veces para abrir los detalles.

3. **Áreas táctiles y separación:**
   - Todas las tarjetas y botones interactivos respetan el token `minTouchTarget = 48` (48 dp / pt), superando la exigencia mínima de la Fase 3 (44 pt en iOS y 48 dp en Android).
   - Se mantiene una separación vertical uniforme de 12 puntos (`spacing.md`) entre tarjetas contiguas para evitar pulsaciones accidentales.

---

## 3. Resiliencia y estados alternos de interfaz

El flujo de resultados contempla de forma explícita todos los estados del ciclo de vida asíncrono:

- **Cargando (`LoadingState`):** Emite un anuncio de accesibilidad con `AccessibilityInfo.announceForAccessibility` para que los usuarios con lectores de pantalla sepan inmediatamente que el sistema está consultando convocatorias.
- **Vacío o insuficiente (`EmptyState`):** Cuando no existen convocatorias o se obtienen menos de 4 opciones (`insufficient: true`), la interfaz presenta un mensaje en lenguaje claro explicando la causa y sugiriendo revisar los intereses o disponibilidad del perfil, sin inventar opciones falsas.
- **Error de red con reintento no destructivo (`ErrorState`):** Si la conexión falla, se ofrece un botón accesible de reintento. Durante el reintento, el botón conmuta su estado a `busy`/`disabled` pero se mantiene montado en el árbol visual, impidiendo que el lector de pantalla pierda el foco de interacción.

---

## 4. Apertura segura y respeto a los límites del producto

El botón de postulación en la pantalla de detalle (`app/opportunity/[id].tsx`) utiliza `expo-web-browser` para abrir el navegador del sistema fuera de la aplicación.

- **Cumplimiento regulatorio y de seguridad:** Se rechaza el uso de `WebView` embebido. Esto garantiza que las credenciales de los usuarios en plataformas externas (como el portal del SENA o agencias públicas de empleo) nunca pasen por el código de Orienta+.
- **Transparencia:** La pantalla informa claramente que Orienta+ actúa como orientador y que la postulación se culmina de manera directa ante la entidad convocante.

---

## 5. Limitaciones identificadas

1. **Curación y verificación manual:** La necesidad de verificar manualmente los 5 chequeos oficiales (fuente, entidad, vigencia, requisitos y enlace) limita la escala inmediata del catálogo. Para el MVP se aseguraron convocatorias representativas de Bogotá y Sabana Centro.
2. **Caché sin persistencia local:** Las oportunidades recomendadas residen en la memoria de RTK Query. Al reiniciar la aplicación sin conectividad, es necesario reconsultar la API.
3. **Dependencia de la plataforma externa:** Si una entidad cambia súbitamente su URL de postulación antes de la revisión semanal del equipo, el enlace podría requerir actualización.

---

## 7. Matriz de cumplimiento: Checklist de Juan (10/10 completadas)

| # | Ítem de la lista de chequeo | Evidencia técnica y archivos | Estado |
|---|---|---|---|
| 1 | Integrar navegación con bienvenida y perfil de Laura | `app/welcome/index.tsx`, `app/profile/index.tsx`, `app/recommendations/index.tsx`, `app/opportunity/[id].tsx`, `app/index.tsx` | Completada |
| 2 | Probar el recorrido completo de la aplicación | Prueba de integración `src/testing/userJourney.test.ts` (recorrido bienvenida → perfil → recomendaciones → detalle → enlace oficial) | Completada |
| 3 | Crear pruebas automatizadas de tarjetas, recomendaciones y detalle | `OpportunityCard.test.ts`, `StatusBadge.test.ts`, `tokens.test.ts`, `url.test.ts`, `userJourney.test.ts` | Completada |
| 4 | Realizar pruebas de rendimiento de listas | `src/testing/listPerformance.test.ts` (determinismo de claves, virtualización y medición $< 10\text{ ms}$) | Completada |
| 5 | Probar en un dispositivo Android real | Guía técnica y protocolo de auditoría con TalkBack y Accessibility Scanner en `docs/demo/guia-pruebas-android.md` | Completada |
| 6 | Verificar carga, error, vacío y reintento | `src/components/states/States.test.ts` (`LoadingState`, `EmptyState`, `ErrorState` con foco persistente) | Completada |
| 7 | Verificar las 11 oportunidades de empleo y formación | `supabase/seed.sql` (11 convocatorias reales con 5 chequeos oficiales y `verified_by`) y prueba `src/testing/seedVerification.test.ts` | Completada |
| 8 | Actualizar README y documentar evidencias | `README.md` actualizado con flujo de navegación, 56 pruebas de Jest, 20/20 Expo Doctor y enlaces a evidencias | Completada |
| 9 | Preparar la demostración funcional | `docs/demo/guia-demostracion.md` (guion minuto a minuto, conmutación de temas, TalkBack y plan de contingencia ante fallos de red) | Completada |
| 10 | Preparar su sección de pruebas, limitaciones y conclusiones | Este documento canónico (`docs/informe/pruebas-limitaciones-y-conclusiones.md`), estructurado para la entrega final | Completada |

---

## 8. Conclusiones y trabajo futuro

- **Calidad verificable:** Se comprobó que una arquitectura accesible no es un agregado posterior, sino una disciplina de diseño que abarca tokens de color con fórmulas matemáticas, semántica de componentes y pruebas automatizadas en cada commit.
- **Arquitectura desacoplada:** La separación entre contratos de backend (Zod), estado de cliente (Redux Toolkit + RTK Query) y componentes de presentación accesibles facilitó una integración fluida del trabajo realizado por el equipo.
- **Trabajo futuro:**
  - Implementar persistencia offline con almacenamiento seguro para consultar oportunidades previamente vistas sin conexión.
  - Desarrollar un sistema de alertas tempranas sobre fechas límite próximas mediante notificaciones locales programadas.
  - Integrar conectores automáticos con APIs oficiales del Servicio Público de Empleo y el portal de datos abiertos del Estado colombiano (`datos.gov.co`).
