# 0009 — Integración a `main` sin revisión obligatoria

- **Estado:** aprobada por Carlos; pendiente de ratificación por Laura y Juan.
- **Fecha:** 2026-11-09.
- **Reemplaza:** las reglas de *pull requests* con aprobación obligatoria y de protección de `main` de la decisión [0008](0008-flujo-de-trabajo-git.md). El resto de 0008 sigue vigente: formato de commits con gitmoji, sin coautoría, sin *squash* y manejo de secretos.

## Contexto

El equipo tiene poco tiempo antes de la entrega y no todos los integrantes pueden revisar *pull requests*. Esperar aprobaciones bloquearía la integración del trabajo.

## Decisión

- **Integración:** quien hace el cambio lo integra a `main`. No se exige la aprobación de otra persona.
- **Ramas:** se recomiendan ramas cortas que se integran el mismo día. Los cambios pequeños, por ejemplo de documentación, pueden ir directo a `main`.
- **Verificación obligatoria antes de subir a `main`.** El autor ejecuta las verificaciones que correspondan a lo que tocó y no integra si alguna falla:
  - backend: `npm run api:test`, `npm run api:check`, `npm run api:lint`, `npm run api:fmt:check`;
  - base de datos: `npx supabase db reset` y `npx supabase test db`;
  - app: `npm run typecheck` y `npx expo-doctor` en `apps/mobile`.
- **Forma de integrar:** *fast-forward* o *merge commit*, nunca *squash*, para conservar la autoría de cada commit.
- **Protección de `main`:** no se configuran aprobaciones obligatorias en GitHub.

## Alternativas descartadas

- **Mantener las PR con aprobación obligatoria:** bloquea la integración si el revisor no está disponible.
- **Integrar sin ninguna verificación:** aumenta el riesgo de romper `main` justo antes de la demo.

## Consecuencias

- Se pierde la evidencia de revisión cruzada en GitHub. Las pruebas automáticas pasan a ser la principal red de seguridad.
- El riesgo de que un integrante no conozca el código de otro sigue existiendo, y la defensa individual vale 40 % de la nota. Se mitiga con la columna "Respaldo para defensa" de `PLANS.md`: cada respaldo debe leer y poder explicar el módulo que le corresponde antes de la entrega.
