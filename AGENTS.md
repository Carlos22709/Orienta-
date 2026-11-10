# Instrucciones del repositorio para agentes

## Orientación obligatoria

Antes de planear o modificar el proyecto, lee `PROJECT_CONTEXT.md` completo. Ese archivo contiene el producto, los requisitos académicos, los límites regulatorios y las decisiones pendientes. Lee también `PLANS.md` para conocer fases, responsables, dependencias y criterios de salida, y `docs/decisions/README.md` para conocer las decisiones técnicas vigentes y la información pendiente. Si existe código o documentación más reciente, inspecciónalos también y usa el repositorio vivo como evidencia del estado real.

## Objetivo

Construir Orienta+, una aplicación móvil accesible que recomiende cuatro o cinco oportunidades verificadas de empleo, formación, becas, subsidios o emprendimiento para jóvenes de 18 a 29 años en Colombia y los dirija al canal oficial.

## Reglas de trabajo

- Responde al usuario en español salvo que pida otro idioma. Usa inglés consistente para identificadores de código cuando se inicie la aplicación.
- Distingue siempre entre requisitos del curso, requisitos del producto, decisiones aprobadas, propuestas y trabajo futuro.
- No inventes requisitos, pruebas ejecutadas, resultados, fuentes de datos ni decisiones arquitectónicas.
- Antes de escribir, inspecciona archivos relevantes, estado de Git y cambios sin confirmar. Conserva cambios ajenos.
- Mantén cambios pequeños, revisables y trazables. Evita abstracciones y dependencias que el equipo no pueda explicar en una defensa individual.
- No hagas commits, pushes, despliegues, publicaciones ni escrituras en servicios externos sin una solicitud explícita.
- No incluyas secretos ni datos personales reales. Usa `.env.example` cuando se definan variables de entorno.
- No presentes mocks estáticos como funcionalidad final. Fixtures y datos semilla deben estar identificados y limitados a desarrollo o pruebas.
- Orienta+ es un agregador/orientador. No agregues recepción de hojas de vida, selección de candidatos o postulaciones internas sin aprobación y revisión legal.
- No marques una tarea como terminada sin ejecutar verificaciones relevantes o declarar con precisión cuáles no pudieron ejecutarse.

## Accesibilidad no negociable

Toda interfaz nueva o modificada debe considerar desde el primer cambio:

- etiquetas, roles, estados y pistas compatibles con VoiceOver/TalkBack;
- foco lógico y agrupación semántica;
- contraste AA y alternativas que no dependan solo del color;
- escalado de texto sin recortes;
- objetivos táctiles de al menos 44 x 44 pt o 48 x 48 dp;
- estados accesibles de carga, vacío, error y éxito.

Registra la ruta exacta del componente y la evidencia de validación para alimentar la matriz de trazabilidad de accesibilidad de la entrega final.

## Implementación y calidad

- Prefiere TypeScript estricto cuando se inicialice el proyecto.
- Mantén componentes pequeños, límites de módulos claros y flujo de datos explícito.
- Valida entradas y respuestas externas en los límites del sistema.
- Mantén separadas la obtención, verificación, ranking y presentación de oportunidades.
- Prueba reglas de elegibilidad, vigencia y selección de cuatro o cinco resultados como lógica de dominio.
- Incluye pruebas de flujos felices, estados vacíos, validación y errores de red según corresponda.
- Ejecuta primero verificaciones enfocadas y después la suite amplia disponible.
- Actualiza documentación y trazabilidad cuando una decisión o implementación cambie el comportamiento observable.

## Comandos

Todavía no existe una aplicación ni comandos de instalación, ejecución o pruebas. No inventes comandos. Cuando se inicialice el stack, documenta los comandos verificados en `README.md` y actualiza esta sección si aportan orientación durable.

## Archivos de instrucciones compatibles

- `AGENTS.md`: instrucciones canónicas para Codex y agentes que reconozcan este estándar.
- `CLAUDE.md`: punto de entrada para Claude Code.
- `GEMINI.md`: punto de entrada para Gemini CLI.
- `.github/copilot-instructions.md`: punto de entrada para GitHub Copilot.

Si cambian las reglas durables, actualiza primero `AGENTS.md` y conserva alineados los demás archivos sin copiar innecesariamente todo el contexto.

