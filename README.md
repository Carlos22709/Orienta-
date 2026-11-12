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
  src/auth/             sesión: PKCE, cliente REST de Supabase Auth, almacenamiento seguro
  src/security/         step-up: lectura de errores de la API y reglas de la verificación
  src/config/           variables de entorno
  src/store/            store de Redux, cliente de la API (RTK Query) y cola de silent refresh
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
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase (local: `http://<IP-del-computador>:54321`). La usa la app para iniciar y renovar la sesión. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave *publishable* de Supabase. Es pública. **Nunca** pongas aquí la clave *secret*: todo lo que empieza por `EXPO_PUBLIC_` queda dentro de la app. |

Los secretos del backend no van en la app (ver [`docs/architecture/diseno-backend.md`](docs/architecture/diseno-backend.md#5-secretos-y-variables-de-entorno)).

## Ejecución

```bash
# 1. API: sirve la función en http://<tu-ip>:8787/api (desde la raíz)
npm run api:serve

# 2. App: abre el código QR con Expo Go (desde apps/mobile)
npx expo start

# Para iniciar sesión con Google, usa el modo túnel (desde apps/mobile)
npm run start:tunnel
```

El inicio de sesión con Google **no funciona** con `npx expo start` en la red local. La URL de regreso lleva la IP del computador (`exp://192.168.x.x:8081/...`), y Supabase Auth rechaza las URL de redirección con IP aunque estén en la lista permitida (ver la decisión 0002). El modo túnel usa un nombre de host con el esquema `exps://` (`exps://…on.expo.app`) y sí funciona, siempre que en Supabase (*Authentication → URL Configuration → Redirect URLs*) estén `exp://**` y `exps://**`. La primera vez puede pedir instalar `@expo/ngrok`: acepta.

## Verificaciones

| Comando | Dónde | Qué verifica |
|---|---|---|
| `npm run api:test` | Raíz | Pruebas de la API con `deno test` |
| `npm run api:check` | Raíz | Tipos del punto de entrada de la función |
| `npm run api:lint` | Raíz | Lint de Deno |
| `npm run api:fmt:check` | Raíz | Verifica el formato sin modificar archivos (`api:fmt` lo corrige) |
| `npm run typecheck` | `apps/mobile` | Tipos de la app con `tsc --noEmit` |
| `npm test` | `apps/mobile` | Pruebas de la app con Jest (`jest-expo`): contraste WCAG AA, vigencia de convocatorias, validación de enlaces externos, estados accesibles, tarjetas, rendimiento de listas, recorrido integrado, PKCE, cliente de Supabase Auth, sesión y silent refresh (56 pruebas en 13 suites) |
| `npx expo-doctor` | `apps/mobile` | Compatibilidad de dependencias con el SDK (20/20 comprobaciones aprobadas) |

Estos comandos se ejecutaron con 100 % de éxito el 2026-11-10.

## Recorrido del usuario y pantallas

Orienta+ guía al joven a través de un flujo estructurado y accesible:

1. **Bienvenida y consentimiento (`apps/mobile/app/welcome/index.tsx`):** Explica los alcances y límites del orientador, y solicita consentimiento informado conforme a la Ley 1581 de 2012.
2. **Captura de perfil (`apps/mobile/app/profile/index.tsx`):** Formulario accesible paso a paso con controles táctiles amplios ($\ge 48\text{ dp}$) para municipio, educación, experiencia laboral, situación actual, intereses y disponibilidad.
3. **Oportunidades recomendadas (`apps/mobile/app/recommendations/index.tsx`):** Lista con virtualización óptima que presenta deliberadamente 4 o 5 opciones verificadas para reducir la sobrecarga cognitiva. Incluye badges de vigencia con texto e íconos y razones transparentes.
4. **Detalle de la oportunidad (`apps/mobile/app/opportunity/[id].tsx`):** Explicación en lenguaje claro, lista de requisitos, evidencia de verificación por el equipo y botón de postulación oficial.
5. **Apertura oficial (`apps/mobile/src/utils/url.ts`):** Redirección segura hacia el sitio web oficial de la entidad convocante mediante el navegador del sistema (`expo-web-browser`), sin WebViews internos.

Documentos de prueba y demostración:

- [Guion de la demostración funcional en vivo](docs/demo/guia-demostracion.md)
- [Guía de pruebas en dispositivo Android real (TalkBack y Accessibility Scanner)](docs/demo/guia-pruebas-android.md)
- [Informe de pruebas, rendimiento, limitaciones y conclusiones (Juan)](docs/informe/pruebas-limitaciones-y-conclusiones.md)

### Base de datos local (requiere Docker)

Antes de la primera vez, crea `supabase/.env` a partir de `supabase/.env.example`. Contiene los secretos locales del 2FA y no se versiona:

```bash
node -e "const c=require('crypto');const r=()=>c.randomBytes(32).toString('base64');require('fs').writeFileSync('supabase/.env','TOTP_ENCRYPTION_KEY='+r()+'\nELEVATED_TOKEN_SECRET='+r()+'\n')"
```

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

Los secretos del 2FA en la nube se generan y se cargan sin mostrarlos. En PowerShell:

```powershell
$k = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
$s = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npx supabase secrets set "TOTP_ENCRYPTION_KEY=$k" "ELEVATED_TOKEN_SECRET=$s"
```

Si `TOTP_ENCRYPTION_KEY` cambia, los factores TOTP ya inscritos dejan de poder descifrarse y cada persona debe inscribirse de nuevo.

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
