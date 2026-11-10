# 0003 — Estado del cliente con Redux Toolkit + RTK Query

- **Estado:** aprobada por Carlos, pendiente de ratificación por Laura y Juan.
- **Fecha:** 2026-11-09.
- **Reemplaza:** la propuesta informal anterior de React Context + TanStack Query, que no llegó a registrarse.

## Contexto

Con cuentas de usuario, la app tiene estado compartido entre varias pantallas:

- sesión y `access_token`;
- reto de step-up pendiente;
- perfil;
- recomendaciones;
- detalle de oportunidades.

El curso trabajó Redux Toolkit en el taller *HeroForge RPG*: slices, `PayloadAction`, Immer, selectores para estado derivado y la regla de no guardar valores calculados en el estado. La defensa individual puede preguntar por manejo de estado, asincronía y ciclo de vida de hooks.

## Decisión

- **Store:** `apps/mobile/src/store/index.ts` con `configureStore` y hooks tipados (`useAppDispatch`, `useAppSelector`).
- **Slices de estado del cliente** (`src/store/slices/`):
  - `authSlice`: `accessToken`, identificador y correo del usuario, estado de la sesión (`unknown | authenticated | signedOut`), `elevatedToken`.
  - `stepUpSlice`: acción crítica pendiente, `stepUpToken` y estado del modal de verificación.
- **Datos del servidor con RTK Query** (`src/store/api.ts`): `catalog`, `profile`, `recommendations`, `opportunity`, endpoints de MFA y acciones críticas. Estos datos viven en la caché de RTK Query y **no se copian a slices**. La invalidación usa *tags*; por ejemplo, actualizar el perfil invalida las recomendaciones.
- **`baseQueryWithReauth`:** envuelve `fetchBaseQuery`, agrega `Authorization` y `X-Elevated-Token` cuando corresponde, e implementa la cola de *silent refresh* descrita en [0002](0002-autenticacion-y-step-up.md).
- **Estado derivado con selectores** (`src/store/selectors.ts`), sin guardar cálculos en el estado:
  - `selectIsAuthenticated`;
  - `selectIsElevated`, que compara la expiración del token con la hora actual;
  - `selectProfileCompleteness`, que indica qué pasos faltan y permite retomar el perfil;
  - `selectCanRequestRecommendations`.
- **Estado local con `useState`:** valores temporales de formularios, visibilidad de elementos de una sola pantalla y animaciones.

## Alternativas descartadas

- **React Context + TanStack Query:** más liviano, pero no aprovecha lo enseñado en el curso y obliga a escribir aparte la cola de renovación. Además, Context re-renderiza a todos los consumidores cuando cambia el valor.
- **Redux Toolkit con thunks y sin RTK Query:** obligaría a reimplementar a mano la caché, los estados de carga y error, y la invalidación.

## Consecuencias

- Más código repetitivo que con Context. El equipo debe poder explicar `configureStore`, Immer, `PayloadAction`, selectores, *tags* y el `baseQuery` con reautenticación.
- Los estados de carga, vacío, error y reintento de cada pantalla salen de los indicadores de RTK Query (`isLoading`, `isError`, `refetch`). Deben traducirse a anuncios accesibles.
- El `access_token` en memoria se pierde al cerrar la app. Por diseño se recupera con el `refresh_token` al iniciar.
