# Guion y preparación de la demostración funcional

- **Responsable del recorrido funcional y pruebas:** Juan Esteban Ramírez Hermosa.
- **Equipo:** Laura Vanesa Reyes Martínez, Carlos Augusto Sánchez Lombana y Juan Esteban Ramírez Hermosa.
- **Tiempo estimado de la demostración:** 5 minutos.
- **Actualización (2026-11-12):** el guion sigue el rediseño Amanecer (bienvenida, cuestionario, pestañas). El primer guion recorría las pantallas anteriores.

## 0. Antes de presentar (15 minutos antes)

1. En `apps/mobile`, corre `npm run start:tunnel`. El túnel es obligatorio para iniciar sesión con Google; ver el README.
2. En Supabase, en *Authentication → URL Configuration*, deben estar `exp://**` y `exps://**`.
3. Ten **dos cuentas de Google de prueba**:
   - una ya registrada, con el perfil completo y la verificación en dos pasos activa en Google Authenticator;
   - otra nueva, para mostrar el cuestionario desde cero.
4. Ten el teléfono con brillo alto, en silencio pero con vibración, y la app autenticadora a mano.
5. Abre la app una vez para que cargue la tipografía y la caché.

## 1. Guion paso a paso

### 0:00 – 0:40 · Bienvenida y propuesta de valor
- **Pantalla:** `app/bienvenida.tsx`.
- **Mensaje clave:**
  > "Orienta+ no es una bolsa de empleo ni recibe hojas de vida. Reúne oportunidades reales y verificadas, y te recomienda solo cuatro o cinco, pensadas para ti."
- **Acción:** mostrar el logo, los tres beneficios y pulsar **Empezar**.

### 0:40 – 1:50 · Cuestionario guiado
- **Pantalla:** `app/cuestionario.tsx`.
- **Mensaje clave:**
  > "Una pregunta por pantalla y nada que escribir. La fecha se elige con la rueda nativa del teléfono, y si cierras la app, retomas donde ibas."
- **Acción:**
  1. Elegir la fecha en la rueda; aparece "Tienes N años".
  2. Responder: municipio **Chía**, estudios **Bachiller**, **Sin experiencia laboral**, **No estudio ni trabajo**, intereses **Formación y cursos** y **Subsidios y apoyos económicos**, disponibilidad **Horario flexible**.
  3. Marcar la autorización (Ley 1581) y pulsar **Continuar con Google** (PKCE en el navegador del sistema).

### 1:50 – 3:00 · Para ti y accesibilidad en vivo
- **Pantalla:** `app/(tabs)/para-ti.tsx`.
- **Mensaje clave:**
  > "Reglas transparentes y deterministas: solo lo que cumples, máximo cinco, con el porqué de cada una."
- **Accesibilidad en vivo:**
  1. **Agrupación (F2):** con VoiceOver o TalkBack, cada tarjeta se lee como un solo bloque. El corazón es un botón aparte que anuncia "Guardar oportunidad".
  2. **Vigencia sin depender del color (V2):** la insignia lleva ícono y texto ("Cierra en N días").
  3. **Háptica y anuncios (A2):** al guardar con el corazón, el teléfono vibra y el lector anuncia "Guardada".
  4. **Pantalla Accesibilidad (F1, F5, F7):** en Perfil, abrir **Accesibilidad**, cambiar a **Oscuro** y subir el texto con **+** hasta 140 % viendo la vista previa. Volver a Para ti: todo cambió al instante y nada se recorta.
  5. **Escuchar (F6):** en el detalle de una oportunidad, tocar **Escuchar**; el teléfono la lee en voz alta.

### 3:00 – 3:50 · Explorar, detalle y sitio oficial
- **Pantallas:** `app/(tabs)/explorar.tsx` y `app/oportunidad/[id].tsx`.
- **Acción:**
  1. En Explorar, buscar "sena" y filtrar por **Becas**.
  2. Abrir una oportunidad y mostrar los requisitos y "Verificada por Orienta+".
  3. Pulsar **Postularme en el sitio oficial**: se abre el navegador del sistema, sin WebView.

### 3:50 – 4:40 · Perfil, verificación en dos pasos y derechos sobre los datos
- **Pantallas:** `app/(tabs)/perfil.tsx`, `perfil/datos.tsx` y `perfil/seguridad.tsx`.
- **Mensaje clave:**
  > "Tus datos son tuyos (Ley 1581): los descargas o eliminas cuando quieras. Esas acciones piden un código de tu app autenticadora."
- **Acción:**
  1. Abrir **Mis datos y privacidad** y pulsar **Descargar mis datos**.
  2. Aparece la ventana "Confirma que eres tú": pegar el código de 6 dígitos (el campo acepta pegar y autocompletar) y abrir el menú para compartir.

### 4:40 – 5:00 · Resiliencia
- Activar el modo avión y deslizar hacia abajo en Para ti: aparece el estado de error en lenguaje claro.
- Quitar el modo avión y pulsar **Reintentar**: el botón anuncia el estado ocupado y recupera la lista.

## 2. Plan de contingencia

| Escenario de fallo | Causa posible | Acción inmediata | Responsable |
|---|---|---|---|
| Falla el Wi-Fi de la universidad | Red congestionada | Punto de acceso desde el celular de Juan o Carlos; el túnel de Expo funciona con datos móviles | Juan |
| Google vuelve a `localhost:3000` | Falta `exps://**` en Supabase o no se usó el túnel | Revisar *URL Configuration* y arrancar con `npm run start:tunnel` | Carlos |
| El código TOTP falla | Hora del teléfono desfasada | Activar la hora automática; el servidor acepta una ventana de ±30 s | Carlos |
| Teléfono sin batería | — | Pasar al segundo teléfono con Expo Go y la sesión de prueba abierta | Laura |
| El sitio oficial tarda | Portal de la entidad lento | Explicar que Orienta+ ya validó el enlace HTTPS y que la carga depende del portal | Juan |
