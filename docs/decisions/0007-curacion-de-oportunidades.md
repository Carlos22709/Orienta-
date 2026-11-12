# 0007 — Curación y verificación de oportunidades reales

- **Estado:** propuesta del agente, aprobada por delegación de Carlos; ratificada por Laura y Juan el 2026-11-12 (confirmación en el grupo del equipo).
- **Fecha:** 2026-11-09.

## Contexto

El enunciado de la Fase 3 prohíbe los datos estáticos simulados sin justificación. La verificación previa es el diferenciador central de Orienta+. Para el MVP no hay scraping ni integraciones, así que las oportunidades se curan a mano. La verificación la debe hacer una persona, porque un agente no puede firmar `verified_by`.

## Decisión

### Volumen y cobertura

- **Meta inicial:** entre 30 y 36 oportunidades reales vigentes.
- Al menos **5 por categoría** (empleo, formación, becas, subsidios y emprendimiento).
- Mezcla de convocatorias nacionales o virtuales y locales de Bogotá + Sabana Centro.
- **Criterio de suficiencia:** cada uno de los perfiles de prueba de la sección siguiente debe obtener al menos 4 recomendaciones con las reglas de la decisión [0005](0005-reglas-de-recomendacion.md). Si alguno no las obtiene, se curan más oportunidades para ese perfil.

### Reparto equitativo

Cada integrante cura y verifica **un tercio** (10–12 oportunidades) y hace commit de su parte del seed. Así la curación también deja participación visible en Git.

| Integrante | Categorías principales sugeridas |
|---|---|
| Laura | Becas y formación |
| Carlos | Subsidios y emprendimiento |
| Juan | Empleo y formación |

**Estado al 2026-11-12:**
- Hay 21 oportunidades cargadas en `supabase/seed.sql` y en la nube.
  - Juan: 11 (empleo y formación).
  - Carlos: 10 (subsidios, emprendimiento y becas). Carlos asumió las becas, que estaban sugeridas para Laura.
- Subsidios (3) y emprendimiento (2) quedan por debajo del mínimo de 5 por categoría: varias convocatorias de 2026 ya cerraron y otras no tenían una página oficial legible.
- El criterio de suficiencia sí se cumple: los cinco perfiles de prueba reciben 5 recomendaciones.
- El detalle, las fuentes y las descartadas están en [`docs/curacion/candidatas-carlos-subsidios-emprendimiento.md`](../curacion/candidatas-carlos-subsidios-emprendimiento.md).

### Lista de chequeo por oportunidad (Fase 1, sección III-C)

Se registra en las columnas `check_*` de la tabla `opportunities`:

1. Proviene de una fuente oficial (sitio de la entidad o portal oficial).
2. La entidad que publica existe y es identificable.
3. La convocatoria está vigente en la fecha de verificación.
4. Los requisitos están completos y transcritos en lenguaje claro en `summary_plain` y `requirements`.
5. El enlace lleva al sitio oficial de inscripción.

Solo se carga una oportunidad si cumple los cinco puntos. `verified_by` es el nombre del integrante que la verificó y `verified_at` la fecha y hora de la revisión.

### Revisión periódica

- Revisión **semanal** de fechas límite y enlaces durante el desarrollo.
- Revisión obligatoria **48 horas antes** de la entrega y de la demo.
- Las oportunidades vencidas o retiradas no se borran: se marcan `closed` o `withdrawn`, para conservar la trazabilidad.

### Perfiles de prueba

Son ficticios y sin datos reales de personas. Sirven para las pruebas de dominio, el criterio de suficiencia y la demo.

| # | Edad | Municipio | Educación | Experiencia | Situación | Intereses | Disponibilidad |
|---|---|---|---|---|---|---|---|
| P1 | 19 | Chía | `secondary` | `none` | `neither` | formación, subsidios | `flexible` |
| P2 | 22 | Bogotá | `university_incomplete` | `lt_1y` | `studying` | becas, empleo | `part_time` |
| P3 | 26 | Zipaquirá | `technical` | `1_3y` | `working` | emprendimiento, formación | `weekends` |
| P4 | 28 | Bogotá | `university` | `gt_3y` | `both` | empleo, becas | `full_time` |
| P5 | 24 | Cajicá | `technologist` | `lt_1y` | `working` | empleo, emprendimiento | `part_time` |

## Consecuencias

- Los datos semilla son datos reales con evidencia de verificación, no mocks. Aun así, se debe documentar en el informe final que la curación es manual y que su escalabilidad es una limitación del MVP.
- Un agente puede ayudar a encontrar candidatas, pero cada una debe abrirla y verificarla un integrante antes de cargarla.
