# 0001 — Stack móvil y backend

- **Estado:** aprobada por Carlos, pendiente de ratificación por Laura y Juan.
- **Fecha:** 2026-11-09.

## Contexto

El enunciado de la Fase 3 exige un cliente en React Native / Expo y menciona, como ejemplos, Redux Toolkit o Context, Expo Router o React Navigation, y persistencia "como Supabase/SQLite". No obliga a ninguno de esos servicios.

El equipo quiere usar Supabase, pero con los endpoints y la lógica de negocio escritos en el repositorio, no consumir la base de datos directamente desde la app. Además, cada integrante debe poder explicar cualquier parte del código en la defensa individual (40 % de la nota), así que se prefiere un solo lenguaje (TypeScript) en todo el proyecto.

## Decisión

| Capa | Elección |
|---|---|
| Cliente | Expo administrado, SDK 58 (React Native 0.88, React 19.3), TypeScript en modo `strict`. Se ejecuta con **Expo Go** en Android e iOS (ver [0004](0004-alcance-del-mvp.md)). |
| Navegación | Expo Router: cada pantalla es un archivo dentro de `apps/mobile/app/`. |
| Estado del cliente | Redux Toolkit + RTK Query (ver [0003](0003-estado-del-cliente.md)). |
| Endpoints | **Supabase Edge Functions** en TypeScript (Deno). Una sola función `api` con un router Hono que agrupa todas las rutas. |
| Lógica de dominio | Módulos puros en `supabase/functions/_shared/domain/` (vigencia, elegibilidad, ranking, TOTP), sin acceso a red ni base de datos, para probarlos de forma aislada. |
| Base de datos | Postgres de Supabase. Esquema versionado en `supabase/migrations/`. |
| Acceso a datos | La app **solo** llama a los endpoints propios y a Supabase Auth. Las tablas de negocio tienen RLS activado y ninguna política de lectura o escritura para `anon` o `authenticated`; la función usa la clave `service_role`, guardada como secreto de Supabase. |
| Autenticación | Supabase Auth con Google (ver [0002](0002-autenticacion-y-step-up.md)). |
| Validación | Zod en los límites: cuerpo de peticiones, respuestas de la API en la app y variables de entorno. |
| Pruebas | Backend: `deno test`. App: Jest (`jest-expo`) + React Native Testing Library. Recorrido completo: Maestro (opcional, por confirmar). |
| Calidad | ESLint (`eslint-config-expo`), Prettier y GitHub Actions con typecheck, lint y pruebas. |
| Desarrollo local | Supabase CLI + Docker. |
| Documentación | Markdown en `docs/` con diagramas Mermaid. |

### Estructura del repositorio

```
apps/
  mobile/                 app Expo
    app/                  pantallas (Expo Router)
    src/
      components/         componentes de UI accesibles
      store/              Redux Toolkit: store, slices, selectores, api (RTK Query)
      services/           auth (PKCE, almacenamiento seguro), cliente HTTP
      theme/              tokens de color, tipografía, espaciado y tamaños táctiles
supabase/
  config.toml
  migrations/             esquema SQL versionado
  seed.sql                oportunidades reales verificadas y catálogo de municipios
  functions/
    api/                  router Hono y rutas HTTP
    _shared/
      domain/             lógica pura: recomendación, elegibilidad, TOTP
      schemas/            esquemas Zod de peticiones y respuestas
docs/
  decisions/              este registro
  architecture/
  accessibility/
.env.example
```

## Alternativas descartadas

- **Consumir Supabase directamente desde la app (sin endpoints propios):** la lógica de recomendación quedaría repartida entre políticas RLS y el cliente; el equipo quiere endpoints en el repositorio.
- **Servidor Node (Fastify/Express) conectado al Postgres de Supabase:** válido, pero obliga a alojar y mantener la API en otro servicio.
- **Django + Django REST Framework:** el proyecto quedaría en dos lenguajes y sin contratos compartidos con la app.
- **React Navigation:** válido, pero con Expo Router la estructura de carpetas refleja las pantallas, lo que facilita ubicar archivos en la defensa.

## Consecuencias

- Las Edge Functions corren en **Deno**: los imports usan especificadores `npm:` o URLs y las pruebas usan `deno test`. El equipo debe aprender esas diferencias con Node.
- Las Edge Functions **no conservan estado entre ejecuciones**. Todo estado de seguridad (anti-replay de TOTP, retos de step-up) se guarda en Postgres, no en memoria.
- Con Expo Go solo se pueden usar módulos incluidos en Expo Go; no se pueden agregar librerías con código nativo propio.
- La clave `service_role` y los secretos del backend nunca van en la app ni en Git. La app solo recibe la URL del proyecto y la clave pública.
- Los comandos de instalación, ejecución y pruebas se documentarán en `README.md` cuando se verifiquen; no se registran antes.

## Por validar

- Que la versión de Expo Go instalada en los teléfonos del equipo sea compatible con SDK 58.
- Que la función `api` pueda configurarse con verificación de JWT desactivada en la plataforma (`verify_jwt = false`) para exponer `/health` y `/catalog` públicamente, validando el token dentro del propio código para las demás rutas.
