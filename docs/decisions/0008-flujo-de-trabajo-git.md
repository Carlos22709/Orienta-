# 0008 — Flujo de trabajo en Git y GitHub

- **Estado:** reemplazada parcialmente por [0009](0009-integracion-sin-revision-obligatoria.md). Las reglas de PR con aprobación obligatoria y de protección de `main` ya no aplican. Siguen vigentes el formato de commits, la ausencia de coautoría, la integración sin *squash* y el manejo de secretos.
- **Fecha:** 2026-11-09.

## Contexto

La rúbrica evalúa un historial de Git con participación **continua y equitativa** de los tres integrantes, y cero secretos en el historial. `PLANS.md` (sección 10) ya fija ramas cortas, commits pequeños y revisión cruzada.

## Decisión

- **Repositorio:** GitHub. Carlos lo crea y agrega a Laura y Juan como colaboradores con permiso de escritura.
- **Rama principal:** `main`, protegida. No se hace push directo; todo entra por *pull request*.
- **Ramas:** cortas y por tarea, con prefijo según el tipo: `feature/…`, `fix/…`, `docs/…`, `test/…`, `chore/…`. Por ejemplo, `feature/auth-pkce` o `docs/accessibility-matrix`.
- **Pull requests:**
  - el revisor es el definido en la matriz de responsabilidad cruzada de `PLANS.md` (sección 4);
  - se exige al menos una aprobación de otra persona;
  - se exige que GitHub Actions pase (typecheck, lint y pruebas) cuando exista.
- **Integración:** *merge commit* o *rebase and merge*, **no** *squash*, para conservar la autoría individual de cada commit en el historial.
- **Mensajes de commit:**
  - formato `<gitmoji> <tipo>(<ámbito>): <descripción en español>`, por ejemplo `✨ feat(auth): genera code_verifier y code_challenge`;
  - gitmojis de referencia: 🎉 inicio, ✨ funcionalidad, 🐛 corrección, 📝 documentación, ♿️ accesibilidad, ✅ pruebas, ♻️ refactorización, 🔧 configuración, 🙈 `.gitignore`, 🔒️ seguridad, 🗃️ base de datos;
  - sin líneas de coautoría (`Co-Authored-By`) ni atribuciones a herramientas;
  - cada persona hace commit de su propio trabajo con su propia identidad de Git;
  - no se dividen commits artificialmente.
- **Secretos:**
  - `.env` y variantes en `.gitignore` desde el primer commit;
  - solo se versiona `.env.example`;
  - antes de cada PR, revisar el diff en busca de claves.
- **Arranque:** los primeros commits (contexto, decisiones y scaffold) se hicieron directamente en `main` antes de activar la protección de la rama. A partir de ese momento, todo cambio entra por PR. Conviene que Laura y Juan hagan commit de sus revisiones o ajustes a los documentos que les corresponden.
- **Protección de `main`:** se configura en GitHub (Settings → Branches) después del primer push.

## Consecuencias

- Las PR obligatorias agregan algo de fricción, pero dejan evidencia de revisión cruzada, útil para la rúbrica y la defensa.
- Sin *squash*, el historial es más largo. A cambio, muestra el trabajo real de cada persona.
