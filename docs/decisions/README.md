# Registro de decisiones de Orienta+

Cada archivo de esta carpeta registra una decisión técnica o de alcance: contexto, decisión, alternativas descartadas, consecuencias y lo que todavía falta validar. Si una decisión cambia, se crea un archivo nuevo y el anterior se marca como reemplazado; no se reescribe la historia.

## Estados

- **Propuesta:** redactada, sin aprobar.
- **Aprobada, pendiente de ratificación:** aprobada por al menos un integrante; falta la confirmación del resto del equipo.
- **Ratificada:** aprobada por Laura, Carlos y Juan.
- **Reemplazada:** sustituida por otra decisión (se indica cuál).

## Índice

| # | Decisión | Estado | Fecha |
|---|---|---|---|
| [0001](0001-stack-movil-y-backend.md) | Stack móvil y backend (Expo + Supabase con endpoints propios) | Aprobada por Carlos, pendiente de ratificación | 2026-11-09 |
| [0002](0002-autenticacion-y-step-up.md) | Autenticación: Google OAuth + PKCE, tokens, silent refresh y step-up con TOTP propio | Aprobada por Carlos, pendiente de ratificación | 2026-11-09 |
| [0003](0003-estado-del-cliente.md) | Estado del cliente con Redux Toolkit + RTK Query | Aprobada por Carlos, pendiente de ratificación | 2026-11-09 |
| [0004](0004-alcance-del-mvp.md) | Alcance del MVP: plataformas, geografía, perfil y fuente de oportunidades | Aprobada por Carlos, pendiente de ratificación | 2026-11-09 |
| [0005](0005-reglas-de-recomendacion.md) | Reglas de vigencia, elegibilidad, ranking y selección | Propuesta del agente aprobada por delegación de Carlos, pendiente de ratificación | 2026-11-09 |
| [0006](0006-identidad-visual-y-tokens.md) | Identidad visual, temas claro/oscuro y tokens con contraste verificado | Propuesta del agente aprobada por delegación de Carlos, pendiente de ratificación | 2026-11-09 |
| [0007](0007-curacion-de-oportunidades.md) | Curación y verificación de oportunidades reales, reparto y perfiles de prueba | Propuesta del agente aprobada por delegación de Carlos, pendiente de ratificación | 2026-11-09 |
| [0008](0008-flujo-de-trabajo-git.md) | Flujo de trabajo en Git y GitHub | Propuesta del agente aprobada por delegación de Carlos, pendiente de ratificación | 2026-11-09 |

## Responsables y cuentas

- **Autenticación, sesión y 2FA:** Carlos (responsable), Juan (revisor), Laura (respaldo para la defensa).
- **Cuentas externas:** Carlos crea y administra el proyecto de Supabase, el cliente OAuth de Google Cloud y el repositorio de GitHub, y da acceso a Laura y Juan para que todos puedan ejecutar y explicar el sistema.

Documentos de diseño derivados:

- [Diseño del backend: modelo de datos, endpoints y flujos](../architecture/diseno-backend.md)
- [Matriz de trazabilidad de accesibilidad (Fase 2 → implementación)](../accessibility/matriz-trazabilidad.md)

## Información pendiente

Estos puntos bloquean o condicionan partes del trabajo. Al resolver uno, se registra la respuesta en la decisión correspondiente y se elimina de esta lista.

| Pendiente | Afecta a | Quién lo resuelve |
|---|---|---|
| Ratificación de las decisiones 0001–0008 por Laura y Juan | Todo | Laura y Juan |
| Fecha y hora exactas de entrega; duración del pitch y la demo | Plan de trabajo, presentación | Equipo (dato del profesor) |
| Logo, si el equipo quiere uno; mientras tanto se usa el nombre como marca de texto | Identidad visual | Laura (opcional) |
| Validaciones técnicas listadas en la sección "Por validar" de 0001 y 0002 | Implementación | Carlos |
