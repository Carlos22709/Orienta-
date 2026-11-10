# Guía de Pruebas en Dispositivo Android Real (TalkBack y Accessibility Scanner)

**Responsable:** Juan Esteban Ramírez Hermosa  
**Dispositivos de prueba:** Teléfonos Android de Juan y Laura con Expo Go (SDK 58)  
**Herramientas:** TalkBack (lector de pantalla nativo de Android) y Accessibility Scanner (Google)  

---

## 1. Preparación del entorno de ejecución

1. **Asegurar conexión en la misma red Wi-Fi:**
   - Tanto la máquina de desarrollo como el teléfono Android deben estar en la misma red local.
2. **Configurar la variable de entorno de la API:**
   - En `apps/mobile/.env`, asignar la IP local de la máquina:
     ```env
     EXPO_PUBLIC_API_URL=http://<IP-LOCAL-DE-TU-PC>:54321/functions/v1/api
     ```
3. **Iniciar el servidor de desarrollo:**
   ```bash
   cd apps/mobile
   npx expo start
   ```
4. **Abrir la aplicación en Expo Go:**
   - Escanear el código QR con la app Expo Go en el teléfono Android.

---

## 2. Protocolo de auditoría con TalkBack

### Configuración inicial:
- Ir a **Ajustes** → **Accesibilidad** → **TalkBack** → Activar.
- Volumen multimedia al 70 % para escuchar con claridad los anuncios de voz.

### Recorrido de prueba y resultados esperados:

| Paso | Pantalla | Acción con TalkBack | Resultado esperado | Resultado verificado |
|---|---|---|---|---|
| 1 | Inicio (`/`) | Deslizar un dedo a la derecha | Se anuncia el encabezado "Orienta+", el lema y el estado del servidor. Los botones de navegación tienen rol "botón". | Cumple |
| 2 | Bienvenida (`/welcome`) | Deslizar por los contenedores | Las tarjetas de "Qué hace" y "Qué no hace" se leen fluidamente. La casilla de consentimiento anuncia "Casilla de verificación, no marcada". Al hacer doble toque conmuta a "Marcada". | Cumple |
| 3 | Perfil (`/profile`) | Recorrer opciones de municipio, educación e intereses | Cada opción táctil anuncia su rol ("botón de selección" o "casilla de verificación") y su estado ("seleccionada" o "no seleccionada"). Los objetivos táctiles son amplios y cómodos. | Cumple |
| 4 | Recomendaciones (`/recommendations`) | Deslizar por las 4 o 5 tarjetas | **Compromiso F2/V3:** La tarjeta `OpportunityCard` se anuncia como una **sola unidad continua** ("Talento Tech MinTIC. Convocatoria de Formación, modalidad Virtual... Toca dos veces para ver requisitos..."). No hay focos fragmentados. | Cumple |
| 5 | Detalle (`/opportunity/[id]`) | Explorar requisitos y verificación | Se leen los requisitos uno a uno precedidos por su viñeta. La procedencia anuncia "Verificado por el equipo de Orienta+: Juan Esteban Ramírez Hermosa". | Cumple |
| 6 | Canal oficial | Doble toque en "Postularme en el sitio oficial ↗" | Se anuncia "Abriendo sitio oficial…", saliendo de Orienta+ hacia el navegador del sistema con la URL oficial de la entidad. | Cumple |
| 7 | Error y reintento | Desactivar Wi-Fi momentáneamente y recargar | `LoadingState` anuncia "Cargando…". Al fallar, `ErrorState` anuncia el problema y el botón "Reintentar" **retiene el foco** con estado `busy`/`disabled` sin desorientar al usuario. | Cumple |

---

## 3. Protocolo con Google Accessibility Scanner

1. Abrir la app **Accessibility Scanner** (descargable de Google Play Store).
2. Conceder permisos de superposición y accesibilidad.
3. Navegar a cada pantalla de Orienta+ y pulsar el botón flotante de captura:
   - **Tamaño de objetivo táctil:** Todos los botones, tarjetas y chips de selección superan los $48 \times 48\text{ dp}$ (definidos en `minTouchTarget`).
   - **Contraste de color:** Se confirma que los textos en tema claro superan $4.5:1$ (verificados matemáticamente en `src/theme/tokens.test.ts`).
   - **Etiquetas de contenido:** Cero advertencias de elementos sin etiqueta o con descripciones duplicadas.
