# Plan de trabajo del equipo — Orienta+

## 1. Objetivo

Organizar la construcción y entrega de Orienta+ entre tres integrantes, con responsabilidades claras, conocimiento cruzado, participación verificable en Git y conocimiento compartido para la defensa técnica individual.

Integrantes:

- Laura Vanesa Reyes Martínez
- Carlos Augusto Sánchez Lombana
- Juan Esteban Ramírez Hermosa

## 2. Alcance funcional prioritario

El producto debe permitir:

1. Explicar qué hace Orienta+ y obtener consentimiento para usar los datos mínimos del perfil.
2. Capturar edad, ubicación, nivel de experiencia e intereses o categorías.
3. Consultar una fuente funcional de oportunidades verificadas.
4. Filtrar oportunidades por vigencia y elegibilidad básica.
5. Mostrar cuatro o cinco recomendaciones relevantes.
6. Consultar detalle, requisitos, fuente, vigencia y razón de recomendación.
7. Abrir el enlace oficial de postulación o inscripción.
8. Comunicar estados de carga, vacío, error y reintento de forma accesible.

### Funcionalidades posteriores al alcance prioritario

- recuperación de contraseña o métodos de inicio de sesión adicionales a Google (el inicio de sesión con Google + PKCE y el 2FA con step-up sí están en alcance; ver `docs/decisions/0002-autenticacion-y-step-up.md`);
- panel administrativo;
- scraping automático de múltiples portales;
- postulaciones dentro de Orienta+;
- carga o envío de hojas de vida;
- chat, notificaciones o dashboards institucionales;
- personalización avanzada y animaciones decorativas.

## 3. Responsabilidades principales

### Laura — Perfil, diseño accesible y trazabilidad

Entregables:

- bienvenida, explicación del alcance y consentimiento;
- captura y edición del perfil;
- tokens visuales y componentes accesibles compartidos;
- semántica para VoiceOver y TalkBack;
- contraste, escalado de texto y tamaños táctiles;
- matriz de trazabilidad de accesibilidad;
- documento final: producto, usuarios, competencia y accesibilidad.

Conocimiento adicional requerido:

- reglas básicas de recomendación;
- navegación entre perfil, resultados y detalle;
- origen, consulta y almacenamiento de los datos.

### Carlos — Arquitectura, datos y recomendación

Entregables:

- inicialización del proyecto React Native/Expo con TypeScript;
- estructura modular y configuración de entorno;
- modelo de datos y fuente funcional de oportunidades;
- validación de vigencia, procedencia y enlaces;
- reglas de elegibilidad, ranking y selección de resultados;
- autenticación: Google OAuth con PKCE, almacenamiento seguro de sesión, cola de silent refresh, 2FA con TOTP propio y step-up (`docs/decisions/0002-autenticacion-y-step-up.md`);
- cuentas externas: proyecto de Supabase, cliente OAuth de Google Cloud y repositorio de GitHub;
- pruebas de la lógica de dominio;
- documento final: arquitectura, modelo de datos y contratos.

Conocimiento adicional requerido:

- componentes accesibles y estados de interfaz;
- recorrido completo del usuario;
- estrategia de pruebas y ejecución de la demostración.

### Juan — Navegación, resultados, calidad y entrega

Entregables:

- navegación entre los flujos de la aplicación;
- lista de recomendaciones y tarjeta de oportunidad;
- detalle y apertura segura del enlace oficial;
- estados de carga, vacío, error y reintento;
- pruebas del recorrido integrado y rendimiento de listas;
- README, preparación de la demostración y presentación;
- documento final: pruebas, limitaciones, conclusiones y trabajo futuro.

Conocimiento adicional requerido:

- captura y validación del perfil;
- reglas de elegibilidad y origen de los datos;
- propiedades de accesibilidad utilizadas en cada pantalla.

## 4. Matriz de responsabilidad cruzada

| Entregable | Responsable | Revisor | Respaldo para defensa |
|---|---|---|---|
| Stack, configuración y arquitectura | Carlos | Juan | Laura |
| Sistema visual y componentes accesibles | Laura | Juan | Carlos |
| Navegación y estrategia de pruebas | Juan | Carlos | Laura |
| Bienvenida, consentimiento y perfil | Laura | Carlos | Juan |
| Modelo y fuente de oportunidades | Carlos | Laura | Juan |
| Vigencia, elegibilidad y ranking | Carlos | Juan | Laura |
| Autenticación, sesión y 2FA con step-up | Carlos | Juan | Laura |
| Curación y verificación de oportunidades (un tercio cada uno, ver `docs/decisions/0007-curacion-de-oportunidades.md`) | Los tres | Los tres | Los tres |
| Lista de cuatro o cinco recomendaciones | Juan | Laura | Carlos |
| Detalle y apertura del canal oficial | Juan | Carlos | Laura |
| Estados de carga, vacío, error y reintento | Juan | Laura | Carlos |
| Auditoría con lector de pantalla | Laura | Carlos | Juan |
| Pruebas de dominio e integración | Carlos | Juan | Laura |
| Pruebas end-to-end y demostración | Juan | Laura | Carlos |
| Documento: producto y competencia | Laura | Carlos | Juan |
| Documento: arquitectura y datos | Carlos | Juan | Laura |
| Documento: pruebas y conclusiones | Juan | Laura | Carlos |
| Revisión final de requisitos | Los tres | Los tres | Los tres |

El responsable implementa, verifica y documenta, y él mismo integra a `main` (decisión 0009). La columna "Revisor" indica quién debería leer el cambio cuando haya tiempo; no es obligatorio aprobarlo. El respaldo **sí** es obligatorio: debe poder ubicar los archivos, explicar el flujo y realizar un cambio pequeño en vivo.

## 5. Fase 1 — Fundamentos y recorrido base

### Objetivo

Establecer una base ejecutable, documentada y accesible sobre la cual integrar el flujo principal.

### Trabajo conjunto

- aprobar stack, plataforma objetivo y estrategia de datos;
- definir los campos mínimos del perfil;
- acordar reglas de elegibilidad y criterio de ranking;
- definir convenciones de código, Git y revisión;
- revisar `PROJECT_CONTEXT.md` y este plan.

### Carlos

- inicializar el proyecto y sus verificaciones base;
- crear la estructura de módulos y los tipos principales;
- configurar variables mediante `.env.example`;
- definir `UserProfile`, `Opportunity` y contratos de servicio;
- conectar una primera consulta a la fuente acordada.

### Laura

- definir colores, tipografía, espaciado y tamaños táctiles;
- construir componentes base accesibles para texto, botones y campos;
- implementar bienvenida, consentimiento y estructura del perfil;
- comprobar etiquetas, roles y mensajes de validación.

### Juan

- configurar la navegación;
- crear las pantallas del recorrido principal;
- preparar tarjeta de oportunidad y estados base;
- configurar la estrategia mínima de pruebas.

### Criterios de salida

- La app inicia sin cierres inesperados.
- Existe navegación entre las pantallas principales.
- La fuente de datos puede consultarse desde la aplicación.
- Los comandos verificados están documentados.
- Cada cambio principal pasó las verificaciones automáticas antes de integrarse.

## 6. Fase 2 — Flujo funcional de extremo a extremo

### Objetivo

Completar el recorrido perfil → recomendaciones → detalle → canal oficial.

### Laura

- completar captura y edición del perfil;
- conectar el perfil con el flujo de recomendaciones;
- implementar validación, foco y anuncios accesibles;
- aplicar componentes y estilos consistentes;
- registrar rutas de archivos en la matriz de accesibilidad.

### Carlos

- completar obtención y validación de oportunidades;
- implementar reglas de vigencia, elegibilidad y ranking;
- garantizar la selección de cuatro o cinco opciones;
- generar una razón básica de recomendación;
- cubrir reglas críticas con pruebas unitarias;
- documentar el flujo de datos y las decisiones arquitectónicas.

### Juan

- completar lista y detalle de oportunidad;
- implementar apertura y validación del enlace oficial;
- completar carga, vacío, error de red y reintento;
- probar navegación y recorrido completo;
- revisar rendimiento y claves estables de las listas.

### Lectura cruzada (opcional, para preparar la defensa)

- Laura lee la experiencia de resultados de Juan.
- Carlos lee la integración del perfil de Laura con el modelo.
- Juan lee y prueba las reglas de recomendación de Carlos.

### Criterios de salida

- El recorrido principal funciona integrado.
- Se muestran únicamente oportunidades vigentes y elegibles.
- El sistema devuelve cuatro o cinco recomendaciones cuando existen suficientes resultados.
- Los estados alternos son utilizables y accesibles.
- La lógica crítica cuenta con pruebas observables.

## 7. Fase 3 — Accesibilidad, robustez y pruebas

### Laura

- auditar etiquetas, roles, estados, agrupación y orden de foco;
- probar escalado de texto y ausencia de recortes;
- verificar contraste y tamaños táctiles;
- consolidar la matriz de accesibilidad con evidencia.

### Carlos

- reforzar validación de respuestas externas y expiración;
- revisar privacidad, datos mínimos y configuración segura;
- verificar que no existan secretos versionados;
- completar pruebas de dominio e integración de datos.

### Juan

- ejecutar pruebas del recorrido completo;
- revisar navegación, asincronía y rendimiento de listas;
- comprobar carga, vacío, error y reintento;
- definir y validar un recorrido reproducible para la demostración.

### Auditoría conjunta

Ejecutar al menos una auditoría con TalkBack o VoiceOver y registrar:

- dispositivo o emulador utilizado;
- recorrido probado;
- resultado observado;
- defecto encontrado;
- responsable y estado de la corrección.

### Criterios de salida

- El recorrido principal supera las pruebas funcionales acordadas.
- Existe evidencia de auditoría con lector de pantalla.
- La matriz enlaza requisitos, archivos y resultados de validación.
- No quedan defectos críticos sin registrar.

## 8. Fase 4 — Documento, presentación y defensa

### Distribución del documento final

- **Laura:** visión, problema, usuarios, competencia, innovación y accesibilidad.
- **Carlos:** arquitectura, decisiones técnicas, modelo de datos y contratos.
- **Juan:** pruebas, rendimiento, limitaciones, conclusiones y trabajo futuro.
- **Los tres:** referencias, revisión de coherencia y conclusiones finales.

### Presentación y demostración

- Laura presenta problema, usuarios y accesibilidad.
- Carlos presenta arquitectura, datos y recomendación.
- Juan presenta recorrido funcional, pruebas y conclusiones.
- Los tres ejecutan y ensayan el flujo completo de demostración.

### Preparación para defensa individual

- realizar preguntas técnicas aleatorias entre integrantes;
- explicar archivos y decisiones sin leer una respuesta preparada;
- practicar cambios pequeños en componentes, reglas y navegación;
- comprobar que todos entiendan UI, estado, datos, asincronía y accesibilidad.

### Criterios de salida

- El documento contiene las cinco secciones obligatorias.
- Toda afirmación técnica coincide con el producto construido.
- El README permite instalar y ejecutar el proyecto.
- La demostración fue validada en el dispositivo o emulador elegido.
- Cada integrante puede defender cualquier módulo principal.

## 9. Orden de prioridad

1. App que inicia y no presenta cierres inesperados.
2. Perfil → recomendaciones → detalle → enlace oficial.
3. Datos funcionales, vigencia y elegibilidad.
4. Accesibilidad del recorrido principal.
5. Estados de carga, vacío y error.
6. Pruebas y evidencia.
7. README y documento final.
8. Presentación y preparación de defensa.
9. Mejoras visuales no esenciales.

No sacrificar el recorrido funcional, accesibilidad o evidencia para agregar funciones posteriores al alcance prioritario.

## 10. Flujo de trabajo en Git

1. Cada tarea debe tener alcance y responsable identificables.
2. Usar ramas cortas, por ejemplo `feature/profile`, `feature/recommendations` y `feature/opportunity-results`.
3. Realizar commits pequeños que representen unidades reales de trabajo.
4. Integrar cambios con frecuencia para detectar incompatibilidades.
5. El autor integra su propio cambio a `main` después de pasar las verificaciones; la revisión de otra persona es opcional (decisión 0009).
6. No dividir commits artificialmente para aparentar participación.
7. No subir `.env`, secretos, credenciales ni datos personales reales.
8. Antes de integrar, ejecutar las verificaciones disponibles y registrar cualquier fallo.

La participación equitativa se demuestra con aportes sustanciales en código, pruebas, revisión y documentación, no con el número bruto de commits.

## 11. Definition of Done

Una tarea solo se cierra cuando:

- cumple un requisito trazable;
- funciona integrada, no únicamente de forma aislada;
- contempla estados alternos relevantes;
- aplica accesibilidad en el código;
- cuenta con pruebas o evidencia proporcional al riesgo;
- pasó las verificaciones automáticas disponibles antes de integrarse;
- no introduce secretos ni complejidad innecesaria;
- actualiza documentación cuando cambia el comportamiento;
- el responsable y el respaldo pueden explicarla.

## 12. Seguimiento del equipo

En cada punto de control, cada integrante debe responder:

1. ¿Qué requisito cerró con evidencia?
2. ¿Qué bloqueo necesita resolver?
3. ¿Qué verificaciones ejecutó antes de integrar?
4. ¿Qué módulo ajeno aprendió a explicar?

Cada punto de control debe incluir una demostración del producto funcionando y una redistribución inmediata si una persona concentra demasiado riesgo.

## 13. Riesgos y mitigación

| Riesgo | Mitigación | Responsable de seguimiento |
|---|---|---|
| Fuente de oportunidades inestable | Utilizar una fuente funcional curada y documentar su verificación | Carlos |
| Integración tardía | Integrar cambios pequeños desde la primera fase | Juan |
| Accesibilidad superficial | Aplicarla en cada componente y auditar con lector de pantalla | Laura |
| Documento desconectado del código | Citar archivos y evidencia real; no afirmar funciones inexistentes | Los tres |
| Conocimiento concentrado | Lectura obligatoria del módulo del que se es respaldo y preguntas técnicas aleatorias | Los tres |
| Errores sin una segunda mirada (no hay revisión obligatoria) | Verificaciones automáticas obligatorias antes de integrar a `main` | Autor de cada cambio |
| Fallo de red durante la demostración | Implementar error, reintento y contingencia claramente identificada | Juan |
| Credenciales expuestas | Revisar `.env`, historial y configuración | Carlos |

## 14. Decisiones registradas y pendientes

Las decisiones de stack, autenticación, estado, plataformas, alcance geográfico, perfil y fuente de oportunidades están registradas en `docs/decisions/` y fueron ratificadas por todo el equipo el 2026-11-12. La lista de información pendiente se mantiene en `docs/decisions/README.md`. Entre otros puntos, incluye:

- responsable del módulo de autenticación y 2FA, que no está asignado en la sección 3;
- reglas exactas de elegibilidad y ranking;
- duración del pitch y la demostración.

Ninguna decisión pendiente debe asumirse en la implementación de los módulos que dependen de ella.
