# Guion y Preparación de la Demostración Funcional

**Responsable del recorrido funcional y pruebas:** Juan Esteban Ramírez Hermosa  
**Equipo:** Laura Vanesa Reyes Martínez, Carlos Augusto Sánchez Lombana y Juan Esteban Ramírez Hermosa  
**Tiempo estimado de la demostración:** 4 a 5 minutos  

---

## 1. Guion paso a paso de la demostración

### Minuto 0:00 - 0:45: Bienvenida y Alcance (Laura y Juan)
- **Pantalla:** `app/welcome/index.tsx`
- **Mensaje clave:**
  > "Orienta+ no es una bolsa de empleo ni recibe hojas de vida. Es un orientador inteligente y accesible para jóvenes en Colombia que centraliza convocatorias verificadas y ayuda a elegir entre 4 o 5 caminos realistas."
- **Acción:**
  - Mostrar la tarjeta con los límites del producto (Ley 1581 de 2012).
  - Marcar la casilla de consentimiento accesible y pulsar *"Continuar al perfil →"*.

### Minuto 0:45 - 1:45: Perfil guiado y datos mínimos (Laura y Carlos)
- **Pantalla:** `app/profile/index.tsx`
- **Mensaje clave:**
  > "Solo solicitamos los datos indispensables para evaluar vigencia y elegibilidad. Ningún dato superfluo es almacenado."
- **Acción:**
  - Seleccionar Municipio: **Bogotá, D.C.** o **Chía**.
  - Nivel educativo: **Bachiller**.
  - Situación: **No estudio ni trabajo actualmente** (ruta prioritaria de formación y empleo).
  - Intereses: **Empleo** y **Formación**.
  - Pulsar *"Ver mis recomendaciones (4-5 opciones) →"*.

### Minuto 1:45 - 3:00: Recomendaciones, vigencia y accesibilidad (Juan)
- **Pantalla:** `app/recommendations/index.tsx`
- **Mensaje clave:**
  > "A diferencia de portales que arrojan cientos de resultados dispersos, Orienta+ aplica reglas deterministas de ranking y devuelve exactamente cuatro o cinco opciones para reducir la sobrecarga cognitiva."
- **Demostración de Accesibilidad en Vivo:**
  1. **Agrupación semántica (WCAG F2):** Mostrar con TalkBack cómo la tarjeta `OpportunityCard` se lee en un solo bloque continuo sin fragmentar la lectura.
  2. **Vigencia multimodal (WCAG 1.4.1):** Señalar el `StatusBadge` mostrando que la vigencia usa texto explícito (`✓ Vigente`, `⚠ Cierra en N días`), íconos geométricos y contraste AA, sin depender exclusivamente del color.
  3. **Razones de recomendación transparentes:** Mostrar la caja *"Razón de la recomendación"*: *"Te interesa la formación"*, *"Es en Bogotá, donde vives"*.
  4. **Tema oscuro en vivo:** Conmutar el modo de pantalla en el sistema para evidenciar la paleta de alto contraste para personas con sensibilidad al brillo.

### Minuto 3:00 - 4:00: Detalle de oportunidad y apertura oficial (Juan)
- **Pantalla:** `app/opportunity/[id].tsx`
- **Mensaje clave:**
  > "Cada convocatoria fue verificada a mano por un integrante del equipo. No utilizamos mocks estáticos ni postulaciones dentro de la app: dirigimos de forma segura al portal oficial de la entidad convocante."
- **Acción:**
  - Abrir el detalle de una convocatoria (ej. *Talento Tech MinTIC* o *SENA*).
  - Mostrar los requisitos en lenguaje claro y la caja de trazabilidad: *"Verificado por el equipo de Orienta+: Juan Esteban Ramírez Hermosa"*.
  - Pulsar *"Postularme en el sitio oficial ↗"*: Se abre `expo-web-browser` en el navegador del sistema fuera de la app, protegiendo las credenciales del usuario.

### Minuto 4:00 - 4:30: Resiliencia ante fallos de red (Juan)
- **Demostración de contingencia:**
  - Poner el teléfono en modo avión o desconectar Wi-Fi brevemente.
  - Al refrescar, la app muestra de inmediato `ErrorState` con un mensaje amigable en lenguaje claro.
  - Reactivar conexión y pulsar *"Reintentar"*: el botón conmuta a estado ocupado sin perder el foco en lectores de pantalla y recupera la información.

---

## 2. Plan de contingencia ante fallos técnicos en la presentación

| Escenario de fallo | Causa posible | Acción de contingencia inmediata | Responsable |
|---|---|---|---|
| Falla de Wi-Fi de la universidad | Red congestionada | Activar punto de acceso móvil (Hotspot 4G/5G) desde el teléfono de Juan o Carlos. | Juan |
| Caída del servidor Supabase local | Docker o puerto bloqueado | Usar el proyecto de Supabase en la nube (`--remote`) ya desplegado como respaldo. | Carlos |
| Teléfono sin batería o fallo de pantalla | Bloqueo de dispositivo | Alternar de inmediato al segundo teléfono Android (Laura o Juan) o al emulador de respaldo en la laptop. | Laura |
| Enlace externo tarda en cargar | Sitio web de la entidad lento | Explicar que la validación HTTPS ya se ejecutó con éxito en la app y que la latencia depende de la infraestructura del portal convocante. | Juan |
