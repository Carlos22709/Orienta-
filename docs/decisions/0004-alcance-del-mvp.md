# 0004 — Alcance del MVP: plataformas, geografía, perfil y fuente de oportunidades

- **Estado:** aprobada por Carlos, pendiente de ratificación por Laura y Juan.
- **Fecha:** 2026-11-09.

## Plataformas y dispositivos

- La demo y la auditoría se hacen en **Android y iOS** con **Expo Go**, que es lo que el equipo ha usado durante el semestre:
  - iOS: iPhone de Carlos, con VoiceOver;
  - Android: teléfonos de Laura y Juan, con TalkBack y Accessibility Scanner.
- Expo Go incluye todo lo necesario para el alcance acordado: `expo-web-browser`, `expo-secure-store`, `expo-crypto`, `expo-haptics`, `expo-linking` y `react-native-svg` para el código QR.
- **Limitaciones aceptadas de Expo Go:**
  - no hay esquema de URL propio; la redirección de OAuth usa `exp://`;
  - no se pueden agregar librerías con código nativo que Expo Go no incluya.

  Si más adelante hace falta un esquema propio:
  - en Android el development build es gratuito;
  - en un iPhone físico exige una cuenta de Apple Developer de pago.

## Alcance geográfico

- Bogotá y municipios de la Sabana de Bogotá, más convocatorias nacionales o virtuales sin restricción territorial.
- **Municipios en alcance:** Bogotá D. C. y los 11 de Sabana Centro (Cajicá, Chía, Cogua, Cota, Gachancipá, Nemocón, Sopó, Tabio, Tenjo, Tocancipá, Zipaquirá).
- Los municipios se identifican con su código DIVIPOLA. Los códigos se toman de la publicación oficial del DANE al crear el seed; no se escriben de memoria.

## Perfil del usuario

Finalidad declarada al pedir consentimiento: **generar recomendaciones de oportunidades**. No se recolecta nada que no use la recomendación.

| Campo | Uso en la recomendación |
|---|---|
| Fecha de nacimiento | Rango de edad exacto de cada convocatoria. Solo con el año, la edad tendría un margen de un año y fallaría en los bordes, que es donde suelen estar los límites de las convocatorias. Si la edad queda fuera de 18–29, se explica que Orienta+ está dirigida a ese rango. |
| Municipio | Restricción territorial de la convocatoria. |
| Nivel de experiencia | Requisito mínimo de experiencia. |
| Nivel educativo | Requisito mínimo educativo. |
| Situación actual (estudia, trabaja, ambas, ninguna) | Priorizar rutas; por ejemplo, formación o subsidios para quien no estudia ni trabaja. |
| Categorías de interés (empleo, formación, becas, subsidios, emprendimiento) | Orientar el ranking sin excluir rutas alternativas. |
| Disponibilidad horaria | Compatibilidad con la jornada de la oportunidad. |

- El perfil se guarda en el servidor, asociado a la cuenta, junto con la versión y la fecha del consentimiento.
- La persona puede **exportar** y **eliminar** sus datos desde la app. Ambas acciones están protegidas con step-up (ver [0002](0002-autenticacion-y-step-up.md)).
- El perfil se diligencia **paso a paso** y cada paso se guarda en el servidor. Así se puede retomar sin perder información, como compromete la Fase 2 (cognición, decisión 3).

## Fuente de oportunidades

- Tabla `opportunities` en Postgres con convocatorias **reales**, curadas manualmente por el equipo, de entidades identificables.
- Cada oportunidad registra el chequeo de verificación propuesto en la Fase 1:
  - fuente oficial;
  - entidad real;
  - vigencia;
  - requisitos completos;
  - enlace oficial de inscripción.

  También registra quién la verificó y cuándo (`verified_by`, `verified_at`).
- Los datos se cargan con `supabase/seed.sql`. No son mocks: son convocatorias reales con evidencia de verificación. Al ser datos reales, deben revisarse periódicamente para que no se recomienden convocatorias vencidas.
- Fuera de alcance: scraping automático, panel administrativo e integraciones con APIs de terceros.

## Recomendación y curación

- Las reglas de vigencia, elegibilidad, ranking y selección están en [0005](0005-reglas-de-recomendacion.md).
- El volumen, el reparto y el proceso de verificación de las oportunidades están en [0007](0007-curacion-de-oportunidades.md).

## Fuera de alcance del MVP

Se mantienen las exclusiones de `PROJECT_CONTEXT.md`:

- recepción de hojas de vida, selección de candidatos y postulaciones dentro de la app;
- panel administrativo;
- notificaciones push;
- chat;
- contenido en video.
