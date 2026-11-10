#!/usr/bin/env bash
# =============================================================================
# Prueba de integración de la API contra Supabase LOCAL.
#
# Requisitos (en otra terminal, desde la raíz del repositorio):
#   npx supabase start
#   npx supabase functions serve api
#
# Uso:  bash scripts/prueba-integracion-local.sh
#
# Crea un usuario de prueba con correo y contraseña, solo en la instancia
# local (la app real usa Google), inicia sesión, recorre los endpoints y
# comprueba cada respuesta. Inserta una oportunidad FICTICIA en la base local
# y la borra al terminar. No imprime claves ni tokens.
# =============================================================================
set -euo pipefail

DB_CONTAINER="supabase_db_orienta-plus"
FAILURES=0

# Claves del entorno local: se leen de `supabase status` y no se imprimen.
eval "$(npx supabase status -o env 2>/dev/null |
  grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|PUBLISHABLE_KEY|SECRET_KEY)=')"
PUBLIC_KEY="${PUBLISHABLE_KEY:-${ANON_KEY:-}}"
ADMIN_KEY="${SECRET_KEY:-${SERVICE_ROLE_KEY:-}}"
if [[ -z "${API_URL:-}" || -z "$PUBLIC_KEY" || -z "$ADMIN_KEY" ]]; then
  echo "No se pudo leer la configuración local. ¿Ejecutaste 'npx supabase start'?" >&2
  exit 1
fi
FN="$API_URL/functions/v1/api"

check() { # check <descripción> <esperado> <obtenido>
  if [[ "$2" == "$3" ]]; then
    echo "  ok   $1"
  else
    echo "  FALLA $1 (esperado: $2, obtenido: $3)"
    FAILURES=$((FAILURES + 1))
  fi
}
status_of() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
json_field() { # json_field <expresión JS sobre "body">
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const body=JSON.parse(s);console.log($1)})"
}
psql_local() { docker exec -i "$DB_CONTAINER" psql -U postgres -At -c "$1"; }

EMAIL="prueba-integracion-$(date +%s)@example.com"
PASSWORD="Prueba-$(date +%s)-local"
OPPORTUNITY_ID=""
USER_ID=""

cleanup() {
  [[ -n "$OPPORTUNITY_ID" ]] && psql_local "delete from public.opportunities where id = '$OPPORTUNITY_ID';" >/dev/null || true
  [[ -n "$USER_ID" ]] && curl -s -o /dev/null -X DELETE "$API_URL/auth/v1/admin/users/$USER_ID" \
    -H "apikey: $ADMIN_KEY" -H "Authorization: Bearer $ADMIN_KEY" || true
}
trap cleanup EXIT

echo "1. Endpoints públicos"
check "GET /health responde 200" 200 "$(status_of "$FN/health")"
CATALOG=$(curl -s "$FN/catalog")
check "GET /catalog trae los 12 municipios en alcance" 12 \
  "$(echo "$CATALOG" | json_field 'body.municipalities.length')"

echo "2. Usuario de prueba y sesión"
USER_ID=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $ADMIN_KEY" -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"email_confirm\":true}" |
  json_field 'body.id')
TOKEN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $PUBLIC_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | json_field 'body.access_token')
AUTH=(-H "Authorization: Bearer $TOKEN")
check "se obtuvo un access_token" yes "$([[ ${#TOKEN} -gt 20 ]] && echo yes || echo no)"

echo "3. Autenticación"
check "GET /me/profile sin token responde 401" 401 "$(status_of "$FN/me/profile")"
check "GET /me/profile con token falso responde 401" 401 \
  "$(status_of "$FN/me/profile" -H 'Authorization: Bearer token-falso')"
check "GET /me/profile con sesión responde 200" 200 "$(status_of "$FN/me/profile" "${AUTH[@]}")"

echo "4. Perfil paso a paso"
put_profile() { curl -s -o /dev/null -w '%{http_code}' -X PUT "$FN/me/profile" "${AUTH[@]}" \
  -H "Content-Type: application/json" -d "$1"; }
check "PUT sin consentimiento responde 409" 409 "$(put_profile '{"birthDate":"2007-03-15"}')"
check "PUT con edad fuera de rango responde 422" 422 \
  "$(put_profile '{"consent":{"version":"2026-11-09","accepted":true},"birthDate":"2012-01-01"}')"
check "PUT del primer paso con consentimiento responde 200" 200 \
  "$(put_profile '{"consent":{"version":"2026-11-09","accepted":true},"birthDate":"2007-03-15"}')"
check "GET /recommendations con perfil incompleto responde 409" 409 \
  "$(status_of "$FN/recommendations" "${AUTH[@]}")"
check "PUT del resto del perfil responde 200" 200 \
  "$(put_profile '{"municipalityCode":"25175","educationLevel":"secondary","experienceLevel":"none","currentSituation":"neither","interests":["training"],"availability":"flexible"}')"
check "el perfil quedó completo en la base" 7 \
  "$(psql_local "select completed_steps from public.profiles where user_id = '$USER_ID';")"

echo "5. Recomendación y detalle (oportunidad ficticia, solo local)"
OPPORTUNITY_ID=$(psql_local "insert into public.opportunities (title, summary_plain, category, entity_name, official_url, source_url, deadline, modality, check_official_source, check_entity_real, check_current, check_requirements_complete, check_official_link, verified_by, verified_at) values ('Curso ficticio de prueba de integración', 'Dato de prueba local.', 'training', 'Entidad ficticia', 'https://example.com/inscripcion', 'https://example.com/fuente', current_date + 30, 'virtual', true, true, true, true, true, 'Script de prueba', now()) returning id;" | head -1)
RECS=$(curl -s "$FN/recommendations" "${AUTH[@]}")
check "GET /recommendations incluye la oportunidad" yes \
  "$(echo "$RECS" | json_field "body.items.some(i => i.id === '$OPPORTUNITY_ID') ? 'yes' : 'no'")"
check "la recomendación trae razones" yes \
  "$(echo "$RECS" | json_field "body.items[0].reasons.length > 0 ? 'yes' : 'no'")"
DETAIL=$(curl -s "$FN/opportunities/$OPPORTUNITY_ID" "${AUTH[@]}")
check "GET /opportunities/:id trae el enlace oficial" "https://example.com/inscripcion" \
  "$(echo "$DETAIL" | json_field 'body.officialUrl')"
check "la vista quedó registrada" 1 \
  "$(psql_local "select count(*) from public.opportunity_views where user_id = '$USER_ID';")"
check "un id inexistente responde 404" 404 \
  "$(status_of "$FN/opportunities/00000000-0000-0000-0000-000000000000" "${AUTH[@]}")"

echo "6. Segundo factor (TOTP) y step-up"
# Genera el código TOTP con el crypto de Node: es una implementación
# independiente de supabase/functions/_shared/security/totp.ts.
totp_now() {
  node -e "
    const c = require('crypto');
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0, value = 0; const out = [];
    for (const ch of process.argv[1]) {
      value = (value << 5) | A.indexOf(ch); bits += 5;
      if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; value &= (1 << bits) - 1; }
    }
    const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const h = c.createHmac('sha1', Buffer.from(out)).update(msg).digest();
    const o = h[19] & 15;
    const n = (((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6;
    console.log(String(n).padStart(6, '0'));" "$1"
}
wait_next_window() { sleep $((31 - $(date +%s) % 30)); }
post_json() { curl -s -X POST "$FN$1" "${AUTH[@]}" -H "Content-Type: application/json" -d "$2"; }

check "exportar sin 2FA activo responde 403" 403 "$(status_of "$FN/me/data-export" "${AUTH[@]}")"
SEED=$(post_json /mfa/enroll '{}' | json_field 'body.secret')
check "POST /mfa/enroll entrega una semilla Base32 de 32 caracteres" 32 "${#SEED}"
check "el secreto se guarda cifrado (no aparece en la base)" 0 \
  "$(psql_local "select count(*) from public.mfa_factors where user_id = '$USER_ID' and encode(secret_ciphertext, 'escape') like '%$SEED%';")"
check "confirmar con el código de Node activa el 2FA" true \
  "$(post_json /mfa/enroll/confirm "{\"code\":\"$(totp_now "$SEED")\"}" | json_field 'body.enrolled')"

echo "   (esperando la siguiente ventana de 30 s para no repetir el código)"
wait_next_window
STEP_UP=$(curl -s "$FN/me/data-export" "${AUTH[@]}")
check "exportar sin token elevado responde mfa_required" mfa_required \
  "$(echo "$STEP_UP" | json_field 'body.error')"
STEP_UP_TOKEN=$(echo "$STEP_UP" | json_field 'body.stepUpToken')
check "la base guarda el hash del step_up_token, no el token" 0 \
  "$(psql_local "select count(*) from public.step_up_challenges where token_hash = '$STEP_UP_TOKEN';")"
CODE=$(totp_now "$SEED")
ELEVATED=$(post_json /mfa/verify "{\"stepUpToken\":\"$STEP_UP_TOKEN\",\"code\":\"$CODE\"}" | json_field 'body.elevatedToken')
check "POST /mfa/verify entrega un token elevado" yes "$([[ ${#ELEVATED} -gt 20 ]] && echo yes || echo no)"

REPLAY_TOKEN=$(curl -s "$FN/me/data-export" "${AUTH[@]}" | json_field 'body.stepUpToken')
check "reusar el mismo código responde 409 (anti-replay)" 409 \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$FN/mfa/verify" "${AUTH[@]}" \
    -H "Content-Type: application/json" -d "{\"stepUpToken\":\"$REPLAY_TOKEN\",\"code\":\"$CODE\"}")"

EXPORT=$(curl -s "$FN/me/data-export" "${AUTH[@]}" -H "X-Elevated-Token: $ELEVATED")
check "con token elevado la exportación trae el perfil" 2007-03-15 \
  "$(echo "$EXPORT" | json_field 'body.profile.birthDate')"
check "la exportación no incluye la semilla TOTP" no \
  "$(echo "$EXPORT" | grep -q "$SEED" && echo yes || echo no)"

check "DELETE /me con token elevado responde 204" 204 \
  "$(status_of -X DELETE "$FN/me" "${AUTH[@]}" -H "X-Elevated-Token: $ELEVATED")"
check "la cuenta y sus datos se borraron en cascada" 0 \
  "$(psql_local "select (select count(*) from auth.users where id = '$USER_ID') + (select count(*) from public.profiles where user_id = '$USER_ID') + (select count(*) from public.mfa_factors where user_id = '$USER_ID');")"
USER_ID="" # ya no hay usuario que limpiar

echo "7. La clave pública no puede leer tablas directamente"
check "REST /opportunities con la clave pública responde 401" 401 \
  "$(status_of "$API_URL/rest/v1/opportunities?select=id" -H "apikey: $PUBLIC_KEY" -H "Authorization: Bearer $PUBLIC_KEY")"

echo
if [[ $FAILURES -eq 0 ]]; then
  echo "Resultado: todas las comprobaciones pasaron."
else
  echo "Resultado: $FAILURES comprobaciones fallaron."
  exit 1
fi
