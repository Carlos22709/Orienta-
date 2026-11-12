# 0002 — Autenticación, sesión y step-up con TOTP

- **Estado:** aprobada por Carlos, ratificada por Laura y Juan el 2026-11-12 (confirmación en el grupo del equipo).
- **Fecha:** 2026-11-09.

## Contexto

Orienta+ tendrá cuentas de usuario porque guarda un perfil con datos personales (Ley 1581 de 2012) y porque la rúbrica de la Fase 3 pregunta por el "almacenamiento seguro de sesión".

El curso trabajó estos conceptos en el laboratorio de la Sesión 14 (*Seguridad Móvil — OAuth 2.0 con PKCE, Almacenamiento Criptográfico y Step-Up 2FA*):

- OAuth 2.0 con PKCE (RFC 7636);
- separación entre `access_token` en memoria y `refresh_token` en almacenamiento seguro;
- cola de *silent refresh*;
- TOTP según RFC 6238 sin librerías de alto nivel;
- step-up con anti-replay.

La regla del laboratorio es evitar las "cajas negras" que el equipo no pueda explicar.

## Decisión

### 1. Inicio de sesión: Google mediante Supabase Auth, con PKCE implementado por la app

- El proveedor de identidad es Google, configurado en Supabase Auth. No hay registro con contraseña ni recuperación de contraseña.
- La app implementa el flujo **Authorization Code + PKCE** contra los endpoints REST de Supabase Auth. **No** se usa `supabase-js` para la autenticación en el cliente, para que cada paso sea visible y explicable.
- `code_verifier`: 32 bytes aleatorios de `expo-crypto`, codificados en Base64URL (43 caracteres URL-safe).
- `code_challenge`: `BASE64URL(SHA-256(code_verifier))` sin relleno; `code_challenge_method=s256`.
- `state`: valor aleatorio por intento, guardado solo en memoria. Si el `state` que vuelve en la redirección no coincide, se aborta el intercambio.
- Navegador: `WebBrowser.openAuthSessionAsync` (navegador del sistema). Está prohibido usar `WebView`.
- Redirección: en Expo Go la URL de regreso la genera `Linking.createURL('auth/callback')` (esquema `exp://`). Debe estar en la lista de URLs de redirección permitidas de Supabase.
- Intercambio: la app envía `auth_code` + `code_verifier` a Supabase Auth (`grant_type=pkce`) y recibe `access_token` y `refresh_token`.

### 2. Tokens y almacenamiento

| Token | Dónde vive | Vida útil objetivo |
|---|---|---|
| `access_token` (JWT de Supabase) | Solo en memoria, dentro del store de Redux. Nunca se persiste. | 5 minutos (configurable en Supabase Auth). |
| `refresh_token` | `expo-secure-store` (Keychain en iOS, Keystore en Android). Se guarda **solo** este valor, no la sesión completa. | Rotación en cada uso (Supabase); límite de 30 días por validar. |
| `elevated_token` (propio) | Solo en memoria. | 10 minutos. |

Al abrir la app:

- si existe un `refresh_token`, se renueva la sesión y se obtiene un `access_token` nuevo;
- si no existe o la renovación falla, la app navega a la pantalla de bienvenida.

Al cerrar sesión se revoca la sesión en Supabase Auth y se borra el `refresh_token` de `expo-secure-store`.

### 3. Cola de *silent refresh*

Se implementa en el `baseQuery` de RTK Query (ver [0003](0003-estado-del-cliente.md)):

1. Si una petición a la API responde `401`, se dispara **una sola** renovación con el `refresh_token`. Las demás peticiones que fallen mientras tanto esperan esa misma promesa.
2. Si la renovación funciona, se actualiza el `access_token` en el store, se guarda el nuevo `refresh_token` y se reintentan las peticiones pendientes.
3. Si la renovación falla, se borra el almacenamiento seguro, se limpia el store y la app navega a la bienvenida con un mensaje accesible.

### 4. Segundo factor: TOTP verificado por código propio en el backend

- La persona activa el 2FA desde la pantalla de seguridad y usa una app autenticadora externa (por ejemplo Google Authenticator).
- No se construye un autenticador dentro de Orienta+, porque tener el segundo factor en la misma app tiene poco sentido de producto.
- **Inscripción:**
  - `POST /mfa/enroll` genera un secreto de 20 bytes;
  - el secreto se guarda cifrado con AES-GCM, usando la clave `TOTP_ENCRYPTION_KEY` (secreto de Supabase);
  - la respuesta es el URI `otpauth://totp/Orienta+:<correo>?secret=<BASE32>&issuer=Orienta+`;
  - la app lo muestra como código QR y como texto copiable;
  - `POST /mfa/enroll/confirm` activa el factor solo después de verificar un primer código válido.
- **Verificación RFC 6238 escrita por el equipo** en `supabase/functions/_shared/security/totp.ts` (Base32 propio en `base32.ts` y cifrado del secreto en `secret-encryption.ts`, en la misma carpeta):
  1. `T = floor(unix / 30)`, codificado como entero de 64 bits big-endian (8 bytes);
  2. `H = HMAC-SHA1(secreto, T)` con Web Crypto;
  3. truncamiento dinámico: `offset = H[19] & 0x0F`;
  4. se toman 31 bits desde `offset`;
  5. `código = bin_code mod 10^6`, con ceros a la izquierda.
- Se aceptan las ventanas `C-1`, `C` y `C+1`. Está prohibido usar `otplib`, `speakeasy` o librerías equivalentes. El decodificador Base32 también es propio.
- Las pruebas usan los vectores del Apéndice B de RFC 6238 (SHA-1).
- **Anti-replay:**
  - se guarda `last_used_step` por usuario en Postgres;
  - un código cuya ventana sea menor o igual a la última usada se rechaza con `409 replay_detected`;
  - va en la base de datos porque las Edge Functions no comparten memoria.

### 5. Step-up para acciones críticas

Las acciones críticas son los derechos de la Ley 1581 sobre los propios datos:

- `GET /me/data-export`: exportar mis datos;
- `DELETE /me`: eliminar mi cuenta y mis datos.

Flujo:

1. Si la petición llega sin un `elevated_token` válido, la API responde `403` con `{ "error": "mfa_required", "stepUpToken": "…", "expiresAt": "…" }`. Los nombres van en camelCase, como el resto de la API.
   - El `step_up_token` es aleatorio, de un solo uso y expira en 5 minutos. Se guarda su hash en `step_up_challenges`.
   - Si la persona no ha inscrito el 2FA, la respuesta es `403` con `{ "error": "mfa_enrollment_required" }` y la app la lleva a inscribirlo.
2. La app atrapa el `403`, abre el modal de verificación y envía `step_up_token` + código a `POST /mfa/verify`.
3. Si el código es válido, la API devuelve un `elevated_token`:
   - es un JWT HS256 firmado con `ELEVATED_TOKEN_SECRET`;
   - lleva los claims `sub`, `mfa_verified: true` y `exp` de 10 minutos.
4. La app repite la acción crítica con el encabezado `X-Elevated-Token` además del `Authorization` normal.

### 6. Accesibilidad de la autenticación (WCAG 2.2, criterio 3.3.8)

- El inicio de sesión con Google no exige memorizar ni transcribir nada dentro de Orienta+.
- El campo del código TOTP:
  - acepta pegar;
  - usa teclado numérico;
  - usa `textContentType="oneTimeCode"` en iOS y `autoComplete="one-time-code"`;
  - tiene etiqueta, pista y anuncio de error para lector de pantalla.
- Ningún vencimiento de token hace perder datos ya ingresados:
  - si el `step_up_token` vence, la app pide uno nuevo y conserva la acción pendiente;
  - el `access_token` se renueva en silencio.

  Esto respeta el compromiso de la Fase 2 de no imponer límites de tiempo estrictos (ver la [matriz de accesibilidad](../accessibility/matriz-trazabilidad.md)).

## Alternativas descartadas

- **`supabase-js` con refresco automático:** oculta el PKCE, el almacenamiento y la renovación que el equipo debe poder explicar.
- **MFA nativo de Supabase:** no permite controlar ni explicar el anti-replay ni la verificación.
- **Correo y contraseña:** no aplica PKCE ni el flujo por navegador del sistema, y añade recuperación de contraseña.
- **Autenticador dentro de la app:** cubre más del laboratorio, pero pone el segundo factor en el mismo dispositivo y la misma app que protege.

## Consecuencias

- Hay más código de seguridad que probar. Las funciones de PKCE, TOTP y Base32 deben tener pruebas unitarias con vectores conocidos.
- Se necesita un cliente OAuth en Google Cloud y configurar el proveedor en Supabase. Son operaciones externas a cargo del equipo.
- En Expo Go la URL de redirección incluye la IP local y cambia entre redes. En desarrollo se usa un comodín en la lista de redirecciones de Supabase; en la demo se verifica antes de presentar.
  - **Comprobado el 2026-11-12:** Supabase Auth rechaza cualquier `redirect_to` cuyo host sea una dirección IP distinta de la de loopback, y lo hace antes de consultar la lista de redirecciones (`IsRedirectURLValid` en `internal/utilities/request.go` del repositorio `supabase/auth`). En ese caso usa la *Site URL*, y en el teléfono aparece "couldn't connect to the server".
  - Por eso el inicio de sesión se prueba con `npx expo start --tunnel`: la URL usa un nombre de host (`exp://…exp.direct/--/auth/callback`) que sí coincide con `exp://**`.
- No se cumple literalmente el punto del laboratorio sobre un esquema de URL propio (`orientaplus://`), porque Expo Go no lo permite. Si se necesita, se requiere un development build (ver [0004](0004-alcance-del-mvp.md)).

## Por validar (pruebas técnicas antes de implementar)

1. Que Supabase Auth acepte `code_challenge` y `code_challenge_method` en `/auth/v1/authorize?provider=google` y canjee el código con `/auth/v1/token?grant_type=pkce` cuando el cliente no usa `supabase-js`.
2. Que el parámetro `state` propio sobreviva en la URL de `redirect_to` hasta la app.
   - **Validado en parte (2026-11-12):** Supabase guarda el `redirect_to` con su query (`?state=…`) intacto en `auth.flow_state.referrer`. Falta confirmarlo de punta a punta en el dispositivo.
3. El valor mínimo configurable de expiración del JWT y si el límite de 30 días para la sesión está disponible en el plan de Supabase que se use. Si no lo está, se documenta la diferencia.
4. Que HMAC-SHA1 y AES-GCM de Web Crypto estén disponibles en el runtime de Edge Functions.
5. Cómo validar el `access_token` de Supabase dentro de la función (JWKS o endpoint de usuario de Supabase Auth).
