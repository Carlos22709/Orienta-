# 0005 — Reglas de vigencia, elegibilidad, ranking y selección

- **Estado:** propuesta del agente, aprobada por delegación de Carlos; pendiente de ratificación por Laura y Juan.
- **Fecha:** 2026-11-09.

## Contexto

La propuesta de valor de Orienta+ es recomendar solo cuatro o cinco oportunidades vigentes y elegibles, con continuidad entre categorías. Las reglas deben ser transparentes, deterministas y explicables línea por línea en la defensa, así que se descartan modelos estadísticos o LLM. Se implementan como funciones puras en `supabase/functions/_shared/domain/` y se prueban con `deno test`.

## Decisión

### 1. Vigencia (filtro obligatorio)

Una oportunidad es **vigente** si `status = 'active'` y cumple una de estas condiciones:

- `deadline` es igual o posterior a la fecha actual en Colombia (`America/Bogota`);
- no tiene `deadline` (convocatoria abierta) y `verified_at` tiene como máximo **30 días**.

Estado visible de cada oportunidad vigente:

| Estado | Condición | Presentación |
|---|---|---|
| Vigente | Cierra en más de 7 días o es abierta | Texto "Vigente" + ícono + color de éxito |
| Por cerrar | Cierra en **7 días o menos** (incluye hoy) | Texto "Cierra en N días" o "Cierra hoy" + ícono + color de advertencia |
| Cerrada | No vigente | Nunca se recomienda. Si se abre por enlace directo, se muestra "Cerrada" + ícono + color de error |

### 2. Elegibilidad (filtros obligatorios)

Todas las condiciones deben cumplirse:

1. **Edad:** la edad actual, calculada con `birth_date`, está entre `min_age` y `max_age` (ambos inclusive y opcionales).
2. **Ubicación:** `municipality_codes` es nulo (nacional o virtual) o incluye el municipio del perfil.
3. **Educación:** el nivel del perfil es mayor o igual que `min_education`, según el orden del enumerado.
4. **Experiencia:** el nivel del perfil es mayor o igual que `min_experience`, según el orden del enumerado.
5. **Disponibilidad:** `availability` de la oportunidad es nula, o comparte al menos un valor con la del perfil, o el perfil declara `flexible`.

Las oportunidades que no cumplen **nunca** se muestran como recomendación. No se rellena con opciones no elegibles.

### 3. Puntaje (ranking transparente)

Cada oportunidad elegible recibe puntos enteros:

| Regla | Puntos |
|---|---|
| La categoría está entre los intereses del perfil | +3 |
| La categoría es una ruta prioritaria para la situación actual (tabla siguiente) | +2 |
| Es local: `municipality_codes` incluye el municipio del perfil (no nacional) | +1 |
| Está por cerrar | +1 |

Rutas prioritarias por situación actual, que implementan la "continuidad de ruta" de la Fase 1:

| Situación actual | Categorías prioritarias |
|---|---|
| `neither` (no estudia ni trabaja) | `training`, `subsidy`, `entrepreneurship` |
| `studying` | `scholarship`, `training` |
| `working` | `training`, `entrepreneurship`, `employment` |
| `both` | `scholarship`, `training` |

Desempate, en orden:

1. fecha límite más cercana (las abiertas al final);
2. `verified_at` más reciente;
3. `id`, para que el resultado sea determinista.

### 4. Selección de cuatro o cinco resultados con diversidad

1. Se ordenan las elegibles por puntaje y desempate.
2. Se toman en ese orden hasta 5, con un máximo de **2 por categoría**.
3. Si al aplicar el máximo por categoría quedan menos de 5 y aún hay elegibles sin usar, se completa en orden sin el límite por categoría.
4. Resultado:
   - **5 o 4 resultados:** caso normal.
   - **1 a 3 resultados:** se devuelven con `insufficient: true` y un mensaje en lenguaje claro que explica que hay pocas opciones para el perfil e invita a revisarlo. No se agregan opciones no elegibles.
   - **0 resultados:** estado vacío accesible con el mismo mensaje y acceso directo para editar el perfil.

### 5. Razones de la recomendación

Cada resultado incluye entre una y tres razones en lenguaje claro, generadas a partir de las reglas que se cumplieron. Por ejemplo:

- "Te interesa la formación";
- "Es una buena ruta si hoy no estás estudiando ni trabajando";
- "Es en Chía, donde vives";
- "Cierra en 5 días".

No se generan razones que no provengan de una regla.

## Pruebas mínimas exigidas

- Vigencia: límite exacto de la fecha (hoy incluido), convocatoria abierta con verificación de 30 y 31 días, y cambio de día en zona horaria de Bogotá.
- Elegibilidad: cada filtro por separado y en sus bordes (edad igual a `min_age` y `max_age`).
- Selección: nunca más de 5 resultados; máximo 2 por categoría cuando hay suficientes; relleno cuando no los hay; casos de 0, 1–3 y 4+ elegibles.
- Determinismo: la misma entrada produce siempre la misma salida.

## Consecuencias

- Las reglas son fáciles de explicar y probar, pero no aprenden de la conducta del usuario. Esa mejora queda como trabajo futuro.
- Los valores de los umbrales (7 días, 30 días, 2 por categoría y los puntajes) quedan como constantes nombradas en un solo archivo para poder ajustarlos y justificarlos.
