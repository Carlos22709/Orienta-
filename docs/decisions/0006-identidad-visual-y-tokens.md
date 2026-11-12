# 0006 — Identidad visual y tokens accesibles

- **Estado:** propuesta del agente, aprobada por delegación de Carlos; ratificada por Laura y Juan el 2026-11-12 (confirmación en el grupo del equipo). Laura es la responsable del sistema visual y puede ajustarla, siempre que vuelva a verificar los contrastes.
- **Fecha:** 2026-11-09.

## Contexto

No existe identidad visual previa ni diseño en Figma. Los compromisos de la Fase 2 exigen:

- contraste de 4.5:1 en texto y 3:1 en componentes gráficos;
- estados que no dependan solo del color;
- objetivos táctiles amplios;
- atender la sensibilidad al brillo.

La Fase 3 pide además escalado de texto sin recortes y que en la demo se muestren "contraste/temas".

## Decisión

- **Nombre visible:** Orienta+. Mientras no haya logo, se usa el nombre como marca de texto.
- **Temas:** claro y oscuro, siguiendo la configuración del sistema (`userInterfaceStyle: "automatic"`). El tema oscuro atiende la sensibilidad al brillo mencionada en la Fase 2 (visión).
- **Tipografía:** fuente del sistema (San Francisco en iOS, Roboto en Android), porque respeta el escalado dinámico del sistema operativo.
  - Tamaños base: cuerpo 16, secundario 14 (mínimo), título de pantalla 24, título de tarjeta 18.
  - `lineHeight` de 1.5 veces el tamaño en el cuerpo y 1.3 veces en los títulos.
  - No se fija `maxFontSizeMultiplier` en texto de contenido; si un control lo necesita, se justifica en la matriz de accesibilidad.
- **Área táctil mínima:** 48 en ambas plataformas, separación de 12 entre tarjetas, y `hitSlop` en íconos de menor tamaño visual.
- **Espaciado:** escala 4, 8, 12, 16, 24 y 32.

### Paleta

Contraste calculado con la fórmula de luminancia relativa de WCAG 2.x. El script de cálculo debe convertirse en prueba unitaria en `apps/mobile/src/theme/`.

| Token | Claro | Contraste en claro (fondo / superficie) | Oscuro | Contraste en oscuro (fondo / superficie) |
|---|---|---|---|---|
| `background` | `#FFFFFF` | — | `#10151B` | — |
| `surface` | `#F3F5F8` | — | `#1A222B` | — |
| `text` | `#16202B` | 16.46 / 15.07 | `#ECF0F4` | 16.01 / 14.02 |
| `textMuted` | `#46525F` | 7.98 / 7.30 | `#B3BDC9` | 9.64 / 8.44 |
| `primary` (enlaces, botón) | `#0B5CAD` | 6.67 / 6.11 | `#7DB9F5` | 8.85 / 7.75 |
| `onPrimary` (texto sobre botón) | `#FFFFFF` | 6.67 sobre `primary` | `#0A1B2C` | 8.40 sobre `primary` |
| `success` (vigente) | `#1E7A3C` | 5.38 / 4.92 | `#6CD196` | 9.78 / 8.56 |
| `warning` (por cerrar) | `#8A5300` | 6.33 / 5.79 | `#F0BE55` | 10.66 / 9.33 |
| `danger` (error, cerrada) | `#B3261E` | 6.54 / 5.98 | `#FF8F86` | 8.32 / 7.28 |
| `border` (componentes) | `#7A8594` | 3.74 / 3.43 | `#76828F` | 4.68 / 4.10 |
| `focus` (indicador de foco) | `#0B5CAD` | 6.67 / 6.11 | `#7DB9F5` | 8.85 / 7.75 |

Todos los pares de texto superan 4.5:1 y los componentes gráficos superan 3:1.

### Reglas de uso

- Los estados de vigencia y los mensajes de error o éxito siempre combinan **texto + ícono + color**.
- Ningún color se escribe directamente en los componentes; todo sale de `src/theme/tokens.ts`.
- Cualquier color nuevo debe agregarse a la prueba de contraste antes de usarse.

## Consecuencias

- Mantener dos temas duplica la revisión visual, pero cubre el requisito de "temas" de la demo y el compromiso de sensibilidad al brillo.
- `apps/mobile/app.json` usa `userInterfaceStyle: "automatic"`.
