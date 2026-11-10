# Orienta+

> Oportunidades reales, claras y seguras para dar el siguiente paso.

Orienta+ es una aplicación móvil que recomienda entre cuatro y cinco oportunidades verificadas de empleo, formación, becas, subsidios o emprendimiento a jóvenes de 18 a 29 años en Colombia. Cada recomendación dirige al canal oficial de la entidad responsable. Orienta+ es un orientador y agregador, no una agencia de empleo.

Proyecto del curso Desarrollo de Aplicaciones Móviles, Universidad de La Sabana. Equipo: Laura Vanesa Reyes Martínez, Carlos Augusto Sánchez Lombana y Juan Esteban Ramírez Hermosa.

> **Estado:** en construcción. Hoy existe la estructura base: la app consulta el endpoint `/api/health` de la API propia. El flujo de negocio, la autenticación y la accesibilidad completa están en desarrollo. Ver [`docs/decisions/`](docs/decisions/README.md).

## Arquitectura

| Capa | Tecnología |
|---|---|
| App móvil | Expo SDK 58 (React Native 0.88), TypeScript strict, Expo Router, Redux Toolkit + RTK Query, Zod |
| API propia | Supabase Edge Functions (Deno) con Hono |
| Datos y autenticación | Postgres y Supabase Auth (Google OAuth + PKCE) |

```
apps/mobile/            app Expo
  app/                  pantallas (Expo Router)
  src/config/           variables de entorno
  src/store/            store de Redux y cliente de la API (RTK Query)
  src/theme/            tokens visuales accesibles
supabase/
  config.toml           configuración local de Supabase
  functions/api/        API propia (Hono): app.ts, routes/, pruebas *.test.ts
  functions/_shared/    código compartido; domain/ = lógica pura de recomendación
docs/
  decisions/            decisiones técnicas y de alcance
  architecture/         modelo de datos, endpoints y flujos
  accessibility/        matriz de trazabilidad de accesibilidad
```

Detalle completo en [`docs/architecture/diseno-backend.md`](docs/architecture/diseno-backend.md).

## Requisitos previos

- Node.js 24 o superior y npm 11 o superior.
- Expo Go compatible con SDK 58 en el teléfono (Android o iOS).
- Docker, solo para levantar Supabase completo en local (`npx supabase start`).

Deno y la Supabase CLI **no** se instalan de forma global: vienen como dependencias de desarrollo en el `package.json` de la raíz.

## Instalación

```bash
# Herramientas del backend (Supabase CLI y Deno)
npm install

# App móvil
cd apps/mobile
npm install
```

Para agregar paquetes a la app usa `npx expo install <paquete>`, que elige versiones compatibles con el SDK 58.

## Variables de entorno

Copia `apps/mobile/.env.example` como `apps/mobile/.env` y completa los valores. El archivo `.env` no se versiona.

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base de la API, terminada en `/api`. En el teléfono usa la IP local de tu computador, no `localhost`. |

Las variables de autenticación y los secretos del backend se agregarán con sus módulos (ver [`docs/architecture/diseno-backend.md`](docs/architecture/diseno-backend.md#5-secretos-y-variables-de-entorno)).

## Ejecución

```bash
# 1. API: sirve la función en http://<tu-ip>:8787/api (desde la raíz)
npm run api:serve

# 2. App: abre el código QR con Expo Go (desde apps/mobile)
npx expo start
```

## Verificaciones

| Comando | Dónde | Qué verifica |
|---|---|---|
| `npm run api:test` | Raíz | Pruebas de la API con `deno test` |
| `npm run api:check` | Raíz | Tipos del punto de entrada de la función |
| `npm run api:lint` | Raíz | Lint de Deno |
| `npm run api:fmt:check` | Raíz | Verifica el formato sin modificar archivos (`api:fmt` lo corrige) |
| `npm run typecheck` | `apps/mobile` | Tipos de la app con `tsc --noEmit` |
| `npx expo-doctor` | `apps/mobile` | Compatibilidad de dependencias con el SDK |

Estos comandos se ejecutaron con éxito el 2026-11-09, salvo `npx expo start` en un dispositivo, que todavía no se ha probado.

### Base de datos local (requiere Docker)

```bash
# Levanta solo lo necesario: Postgres, Auth, PostgREST y el gateway
npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor

# Recrea la base: aplica supabase/migrations/ y carga supabase/seed.sql
npx supabase db reset

# Pruebas pgTAP del esquema (supabase/tests/database/)
npx supabase test db

# Prueba de integración de la API: crea un usuario local, recorre todos los
# endpoints y limpia lo que crea (requiere Node y Docker)
bash scripts/prueba-integracion-local.sh

# Detiene los contenedores
npx supabase stop
```

La primera vez, `supabase start` descarga varias imágenes de Docker y puede tardar varios minutos. Sin excluir `edge-runtime`, `supabase start` también sirve la función `api` en `http://127.0.0.1:54321/functions/v1/api`, con las variables de Supabase ya inyectadas. Para la app en el teléfono, usa `EXPO_PUBLIC_API_URL=http://<IP-del-computador>:54321/functions/v1/api`.

### Proyecto en la nube

Con la Supabase CLI 3.x, los comandos de base de datos apuntan por defecto al Supabase **local**. Para el proyecto en la nube hay que agregar `--remote`:

```bash
npx supabase link --project-ref <ref>       # una sola vez
npx supabase migration list --remote        # migraciones locales vs. aplicadas en la nube
npx supabase db push --remote               # aplica las migraciones pendientes
npx supabase functions deploy api           # despliega la API
```

`db push` no carga `supabase/seed.sql`: hay que ejecutarlo en el SQL Editor del dashboard.

`npm run api:serve` sirve la función sin Supabase: solo responde `/api/health`, y las demás rutas devuelven 500 por falta de configuración.

## Accesibilidad

Orienta+ apunta a WCAG 2.2 nivel AA adaptado a móvil:

- semántica para VoiceOver y TalkBack;
- contraste verificado de los tokens en temas claro y oscuro;
- áreas táctiles de al menos 48;
- estados que no dependen solo del color;
- anuncios de carga y error.

El avance y la evidencia de cada compromiso están en la [matriz de trazabilidad](docs/accessibility/matriz-trazabilidad.md).

## Forma de trabajo

Ramas cortas que integra su propio autor después de pasar las verificaciones ([decisión 0009](docs/decisions/0009-integracion-sin-revision-obligatoria.md)), y commits con gitmoji y sin *squash* ([decisión 0008](docs/decisions/0008-flujo-de-trabajo-git.md)). Las reglas para agentes de IA están en [`AGENTS.md`](AGENTS.md).
