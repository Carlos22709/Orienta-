# Candidatas de Carlos: subsidios y emprendimiento

## Resultado (2026-11-11)

Se leyeron las páginas oficiales. Las de la CCB las abrió Carlos en su navegador, porque bloquean las lecturas automáticas. Carlos aprobó cargar las que se sostienen con su fuente.

**Cargadas en `supabase/seed.sql` y en la nube (5):**
- **Subsidios (3):**
  - Incentivo Sisbén en TransMilenio;
  - Ahorro para mi Casa;
  - Generación FNA. Es un crédito con beneficio en la tasa, no un subsidio en dinero; el resumen lo aclara.
- **Emprendimiento (2):**
  - Ruta Ágil de Emprendimiento (CCB). La convocatoria es permanente;
  - Incubadora Futuras Startups (CCB). El próximo grupo empieza en enero de 2027.

**Pendiente:**
- **S1, subsidio de desempleo:** el ABC del Servicio de Empleo y la ley no se pudieron abrir desde el entorno del agente. Se carga si Carlos confirma que el enlace funciona.

**Descartadas tras la verificación:**
- **E5, iNNpulsa:** la ficha oficial dice "Finalizada".
- **E2, Maratón del 25 de noviembre:** no hay formulario de esa fecha que se pueda confirmar.
- **E3, Ruta Emprendedora del SENA:** la página del SENA no muestra contenido y la del Fondo Emprender da 404.
- **S4, subsidio de vivienda de la caja:** no se encontró una página oficial que se pudiera leer.

**Criterio de suficiencia** (función `recommend` sobre los datos de la nube, 16 oportunidades):
- P1, P2, P4 y P5 reciben 5 recomendaciones.
- P3 recibe 3: 26 años, Zipaquirá, disponibilidad solo fines de semana.

El 2026-11-12 se corrigió la regla de disponibilidad (decisión 0005, regla 5). Con eso y con las becas, **los cinco perfiles reciben 5 recomendaciones**.

## Becas (2026-11-12)

Carlos asumió la parte de becas del reparto de la decisión 0007. Todas se leyeron en sus páginas oficiales.

**Cargadas (5):**
- **Jóvenes a la E 6, instituciones públicas (Atenea):**
  - apoyo de sostenimiento de hasta 1 SMMLV por periodo;
  - para bachilleres de Bogotá admitidos en la Nacional, la Distrital, la Pedagógica, la ETITC o el SENA;
  - cierra el 13 de noviembre de 2026.
- **Jóvenes a la E 6, instituciones privadas (Atenea):**
  - matrícula y apoyo de hasta 1 SMMLV;
  - hasta 28 años;
  - del 12 al 18 de noviembre de 2026.
- **Matrícula Cero (MinEducación):**
  - política permanente;
  - el Ministerio publica dos criterios de edad distintos: su guía de 2025 dice de 14 a 28 años y un comunicado de 2024 dice que no hay límite. Se usó la guía más reciente.
- **Crédito educativo ICETEX 2027-1:**
  - abierto desde el 3 de noviembre de 2026;
  - es un préstamo y el resumen lo aclara.
- **Crédito-Beca COLFUTURO 2027:**
  - postulaciones del 4 de enero al 4 de marzo de 2027;
  - exige título de pregrado.

**Descartadas:**
- **Becas Aliados de la Universidad de La Sabana:** son de posgrado, solo para Sopó, Tenjo y Zipaquirá, y la lista de postulados ya se envió el 2 de noviembre.
- **Becas 2027-1 de Zipaquirá:** cerraron el 29 de octubre.
- **Fulbright:** no hay convocatoria de maestría abierta.

**Cobertura en la nube (21 oportunidades):**

| Categoría | Oportunidades | Mínimo de la decisión 0007 |
|---|---|---|
| Empleo | 5 | Cumple |
| Formación | 6 | Cumple |
| Becas | 5 | Cumple |
| Subsidios | 3 | No cumple (mínimo 5) |
| Emprendimiento | 2 | No cumple (mínimo 5) |

Subsidios y emprendimiento quedan por debajo del mínimo de 5, pero el criterio de suficiencia se cumple.

El resto de este documento es el borrador original de la búsqueda.

---

- **Estado del borrador original:** sin verificar.
- **Responsable de la verificación:** Carlos (decisión [0007](../decisions/0007-curacion-de-oportunidades.md): subsidios y emprendimiento, 10–12 oportunidades).
- **Búsqueda preliminar:** 2026-11-12, en fuentes públicas. La hizo el agente de código como punto de partida; las notas de prensa y blogs solo sirvieron para encontrar la fuente oficial.

## Cómo usar este documento

1. Abre el enlace oficial de cada candidata y revisa los cinco chequeos de la decisión 0007:
   1. fuente oficial;
   2. entidad real e identificable;
   3. vigente hoy;
   4. requisitos completos y en lenguaje claro;
   5. el enlace lleva a la inscripción oficial.
2. Corrige los campos que no coincidan con la fuente (edad, requisitos, fechas, modalidad).
3. Si una candidata no pasa los cinco chequeos, **no la cargues**. Muévela a "Descartadas" con el motivo.
4. Reemplaza cada `<VERIFICAR…>` del SQL. Pon en `verified_at` la fecha y hora reales de tu revisión.
5. Copia las filas verificadas al final de `supabase/seed.sql` y carga el seed en la nube por el SQL Editor (como con los municipios).

El SQL de abajo **no se puede ejecutar tal como está**: los marcadores `<VERIFICAR…>` no son fechas válidas ni empiezan por `https://`, así que la base lo rechaza. Es a propósito, para que nada se cargue sin revisión.

## Resumen

| # | Candidata | Categoría | Alcance | Confianza preliminar |
|---|---|---|---|---|
| S1 | Subsidio de desempleo (Mecanismo de Protección al Cesante) | Subsidio | Nacional, por caja de compensación | Alta: programa permanente por ley |
| S2 | Incentivo Sisbén en TransMilenio | Subsidio | Bogotá | Alta: vigente en 2026 con cambios desde febrero |
| S3 | Mi Casa en Bogotá (Secretaría del Hábitat) | Subsidio | Bogotá | Media: hay página de requisitos 2026; confirmar si sigue recibiendo postulaciones |
| S4 | Subsidio de vivienda de la caja de compensación | Subsidio | Nacional (Compensar, Cafam, Colsubsidio en Bogotá) | Media: vigente según prensa; falta la página oficial de la caja |
| S5 | Generación FNA (Fondo Nacional del Ahorro) | Subsidio / vivienda | Nacional | Baja: solo en guías de terceros; confirmar que exista y si encaja como subsidio |
| E1 | Ruta Bogotá Cundinamarca Emprende (CCB) | Emprendimiento | Bogotá y municipios de la CCB | Alta: servicio permanente y gratuito |
| E2 | Maratón de Emprendimiento, 25 de noviembre (CCB) | Emprendimiento | Bogotá | Media: fecha anunciada; falta el formulario de esa jornada |
| E3 | Ruta Emprendedora del SENA (Fondo Emprender) | Emprendimiento | Nacional | Alta: servicio permanente y gratuito |
| E4 | Incubadora Futuras Startups (CCB) | Emprendimiento | Bogotá y municipios de la CCB | Media: programa por cohortes; confirmar si hay una abierta |
| E5 | Emprendimiento Digital 2026, línea Modelo de Negocio (iNNpulsa y MinTIC) | Emprendimiento | Nacional | Media: abierta "hasta agotar cupos" según fuente oficial sin fecha |

Si todas pasan, quedan 5 subsidios y 5 emprendimientos. Con eso se cumple el mínimo de 5 por categoría de la decisión 0007 para estas dos categorías.

## Descartadas en la búsqueda preliminar

| Programa | Motivo |
|---|---|
| Renta Joven (Prosperidad Social) | Sin inscripciones nuevas en 2026 según varias fuentes; la nota oficial de apertura es de 2024 |
| Jóvenes en Paz | En transición por la liquidación del Ministerio de la Igualdad (Decreto 626 de 2026); sin inscripciones abiertas confirmadas |
| Parceros por Bogotá | No se encontró convocatoria 2026; las páginas son de 2023–2024 |
| Mi Casa Ya | MinVivienda no habilitó inscripciones nuevas en 2026 |
| Fondo Emprender, convocatoria 155 "Jóvenes Emprendedores" | Cerró en abril de 2026; no se encontró otra nacional abierta |
| Innovers 2026 (Bogotá, 18–28 años) | Abrió en abril de 2026; no se encontró evidencia de que siga abierta |
| Emprendópolis 2026 (Bogotá) | Cupos para los primeros 5.000 negocios desde mayo; probablemente cerrada |
| Tocancipá Emprende 2026 | Cerró el 30 de marzo de 2026 |
| Fondo Progresa 2026 (Zipaquirá) | Cerró el 16 de abril de 2026 |
| Capital Semilla 2026 (Cajicá) | Solo existe un proyecto de decreto; no hay inscripciones abiertas confirmadas |

Si alguna de estas reabre antes de la demo, se puede volver a evaluar.

## Detalle por candidata

### S1. Subsidio de desempleo (Mecanismo de Protección al Cesante)
- **Qué encontré:** es permanente (Ley 1636 de 2013) y se postula cada mes en la última caja de compensación a la que la persona estuvo afiliada. Requisitos según las fuentes:
  - estar cesante y sin otros ingresos;
  - haber aportado a la caja 1 año (dependientes) o 2 años (independientes) dentro de los últimos 3;
  - inscribirse en el Servicio Público de Empleo;
  - no haberlo recibido en los últimos 3 años.
- **Verifica:** el enlace de postulación de Compensar, Cafam o Colsubsidio, y el monto vigente. El monto solo aparece en un blog; no lo pongas si no lo confirmas.
- **Fuentes:** [ABC del MPC, Servicio Público de Empleo](https://www.serviciodeempleo.gov.co/wp-content/uploads/2025/07/ABECE-MECANISMO-DE-PROTECCION-AL-CESANTE-compressed.pdf), [Preguntas frecuentes FOSFEC, Superintendencia del Subsidio Familiar](https://www.ssf.gov.co/preguntas-frecuentes-fosfec), [Ley 1636 de 2013](http://www.secretariasenado.gov.co/senado/basedoc/ley_1636_2013.html).

### S2. Incentivo Sisbén en TransMilenio
- **Qué encontré:** es para personas mayores de 16 años registradas en el Sisbén de Bogotá, grupos A1 a B7. Desde 2026 no es un descuento en dinero: se asigna un número de pasajes según el grupo. Se activa con una tarjeta TuLlave personalizada en taquilla o en un punto de recarga.
- **Verifica:** cuántos pasajes da hoy por grupo y si exige Sisbén IV validado.
- **Fuentes:** [TransMilenio, tarifas](https://www.transmilenio.gov.co/viaje-en-transmi/medios-de-pago/tarifas-del-sistema-transmilenio), [Bogotá.gov.co, descuento por Sisbén](https://bogota.gov.co/mi-ciudad/movilidad/descuento-en-tarifa-de-transporte-publico-por-pertenecer-al-sisben), [Integración Social, pasajes](https://www.integracionsocial.gov.co/index.php/noticias/173-noticias-ingreso-minimo-garantizado/7707-pasajes-gratis-en-transmilenio-conozca-quienes-acceden-al-beneficio-y-como-activarlo).

### S3. Mi Casa en Bogotá
- **Qué encontré:** es un programa distrital de subsidio de vivienda con página de requisitos 2026. Entre sus condiciones aparece que el jefe de hogar sea una persona joven.
- **Verifica:** que siga recibiendo postulaciones, la edad exacta, los topes de ingreso y el enlace de postulación de la Secretaría del Hábitat.
- **Fuente:** [Bogotá.gov.co, Mi Casa en Bogotá 2026](https://bogota.gov.co/mi-ciudad/habitat/subsidios-de-vivienda-programa-mi-casa-en-bogota-requisitos-2026).

### S4. Subsidio de vivienda de la caja de compensación
- **Qué encontré:** las cajas mantienen subsidios de vivienda con presupuesto propio en 2026. Requisitos según la prensa:
  - estar afiliado y al día con los aportes;
  - no tener vivienda propia;
  - no haber recibido antes otro subsidio de vivienda.
- **Verifica:** la página oficial de una caja (por ejemplo, Compensar), los requisitos de ingresos y el monto. Si no encuentras la página oficial, descártala.
- **Fuente de partida (prensa):** [Portafolio, subsidios vigentes en 2026](https://www.portafolio.co/mis-finanzas/vivienda/subsidios-de-vivienda-vigentes-en-2026-cajas-de-compensacion-y-programas-locales-tras-mi-casa-ya-485814).

### S5. Generación FNA
- **Qué encontré:** solo menciones en guías de terceros, como un programa del Fondo Nacional del Ahorro para jóvenes de 18 a 28 años que buscan su primera vivienda.
- **Verifica:** que exista en fna.gov.co, sus condiciones y si es un subsidio o una línea de ahorro y crédito. Si es crédito, decide si encaja en "subsidios"; si no, descártala.

### E1. Ruta Bogotá Cundinamarca Emprende (Cámara de Comercio de Bogotá)
- **Qué encontré:** es gratuita y permanente. Incluye talleres y asesorías con un consultor y un plan de trabajo, y empieza con un diagnóstico en línea. Los ciclos se anuncian por correo la última semana del mes anterior.
- **Verifica:** que la jurisdicción de la CCB incluya los 11 municipios de Sabana Centro del alcance. Si los incluye, deja `municipality_codes` en `null`. Si no, lista solo los incluidos.
- **Fuentes:** [CCB, Ruta Emprender](https://www.ccb.org.co/es/servicios/crea-tu-empresa/preparate-para-crear-tu-empresa/ruta-emprender), [términos y condiciones](https://assets.ctfassets.net/n1ptkpqt763u/6V4lxGrDikjVH4JCsuN41t/5d4fd1231a84fcdd3f9a1109769eb407/T%C3%83_rminos_y_condiciones_RUTA_BOGOT%C3%83__CUNDINAMARCA_EMPRENDE_.pdf).

### E2. Maratón de Emprendimiento, 25 de noviembre de 2026 (CCB)
- **Qué encontré:** es una jornada intensiva y gratuita con registro previo. La prensa anuncia la del 25 de noviembre, pero no encontré el formulario de esa fecha.
- **Verifica:** el formulario, la sede y la hora. Si se confirma, es la candidata "por cerrar" que sirve para mostrar ese estado en la demo.
- **Fuentes:** [CCB, Maratón de emprendimiento](https://www.ccb.org.co/de-interes/noticias/maraton-de-emprendimiento), [Diario del Sur](https://www.diariodelsur.com.co/bogota-abre-jornada-gratuita-para-emprendedores-que-buscan-hacer-crecer-sus-negocios/).

### E3. Ruta Emprendedora del SENA (Fondo Emprender)
- **Qué encontré:** es gratuita y la acompañan asesores de emprendimiento del SENA. Es el paso previo para presentarse al Fondo Emprender cuando abra convocatorias. La inscripción se hace en fondoemprender.com o en un centro de emprendimiento.
- **Verifica:** el enlace exacto de inscripción y si exige ser aprendiz o egresado del SENA.
- **Fuentes:** [SENA, Ruta Emprendedora](https://www.sena.edu.co/fondo-emprender-fortalece-las-capacidades-de-mas-negocios-a-traves-de-la-ruta-emprendedora), [El Espectador](https://www.elespectador.com/economia/emprendimiento-y-liderazgo/sena-esta-es-la-ruta-gratuita-para-emprender-en-colombia-y-cuenta-con-financiacion/?outputType=amp).

### E4. Incubadora Futuras Startups (CCB)
- **Qué encontré:** es gratuita, dura tres meses (asesorías, mentorías y pitch day) y es para startups de base tecnológica o científica en Bogotá y los municipios de la CCB.
- **Verifica:** que haya una cohorte con inscripciones abiertas y su fecha de cierre. Si no la hay, descártala.
- **Fuente:** [CCB, Incubadora Futuras Startups](https://www.ccb.org.co/es/servicios/haz-crecer-tu-empresa/innovacion-empresarial/incubadora-de-futuras-startups).

### E5. Emprendimiento Digital 2026, línea Modelo de Negocio (iNNpulsa y MinTIC)
- **Qué encontré:** es para emprendimientos digitales con producto validado y ventas. La página oficial dice que la postulación "continúa abierta", sin fecha visible, y otra fuente dice "hasta agotar cupos".
- **Verifica:** que siga abierta, si exige persona jurídica y la fecha de cierre.
- **Fuente:** [iNNpulsa, Emprendimiento Digital 2026](https://www.innpulsacolombia.com/portfolio/gobierno-nacional-abre-convocatorias-para-fortalecer-entidades-de-apoyo-y-emprendimientos-digitales-del-pais/).

## SQL de las candidatas (completar antes de usar)

Las columnas siguen el orden del seed de Juan. `municipality_codes = null` significa que la oportunidad aplica a todo el alcance; `'{11001}'` la limita a Bogotá.

```sql
insert into public.opportunities (
  title, summary_plain, category, entity_name, official_url, source_url,
  deadline, min_age, max_age, min_education, min_experience, availability,
  municipality_codes, modality, requirements,
  check_official_source, check_entity_real, check_current,
  check_requirements_complete, check_official_link,
  verified_by, verified_at, status
) values
-- S1
(
  'Subsidio de desempleo (Mecanismo de Protección al Cesante)',
  'Apoyo temporal para personas que perdieron su empleo y aportaron a una caja de compensación. Se postula cada mes en la última caja a la que estuviste afiliado.',
  'subsidy', 'Cajas de Compensación Familiar (FOSFEC) - Superintendencia del Subsidio Familiar',
  '<VERIFICAR: enlace de postulación de la caja>',
  'https://www.ssf.gov.co/preguntas-frecuentes-fosfec',
  null, 18, null, null, '1_3y', null, null, 'hybrid',
  array[
    'Estar sin empleo y sin otros ingresos',
    'Haber aportado a una caja de compensación 1 año (dependiente) o 2 años (independiente) en los últimos 3 años',
    'Inscribirte en el Servicio Público de Empleo',
    'No haber recibido este subsidio en los últimos 3 años'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- S2
(
  'Pasajes con incentivo Sisbén en TransMilenio',
  'Si estás en el Sisbén de Bogotá (grupos A1 a B7), puedes recibir pasajes con incentivo en TransMilenio y el SITP con tu tarjeta TuLlave personalizada.',
  'subsidy', 'TransMilenio S.A. - Alcaldía de Bogotá',
  'https://www.transmilenio.gov.co/viaje-en-transmi/medios-de-pago/tarifas-del-sistema-transmilenio',
  'https://bogota.gov.co/mi-ciudad/movilidad/descuento-en-tarifa-de-transporte-publico-por-pertenecer-al-sisben',
  null, 16, null, null, null, null, '{11001}', 'in_person',
  array[
    'Tener más de 16 años',
    'Estar en el Sisbén de Bogotá en los grupos A1 a B7',
    'Tener una tarjeta TuLlave personalizada',
    'Activar el beneficio en una taquilla o punto de recarga'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- S3
(
  'Mi Casa en Bogotá: subsidio de vivienda',
  'Subsidio del Distrito para comprar vivienda en Bogotá. Una de sus condiciones contempla hogares cuyo jefe sea una persona joven.',
  'subsidy', 'Secretaría Distrital del Hábitat - Alcaldía de Bogotá',
  '<VERIFICAR: enlace de postulación de la Secretaría del Hábitat>',
  'https://bogota.gov.co/mi-ciudad/habitat/subsidios-de-vivienda-programa-mi-casa-en-bogota-requisitos-2026',
  null, 18, null, null, null, null, '{11001}', 'hybrid',
  array['<VERIFICAR: requisitos completos desde la fuente oficial>'],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- S4
(
  'Subsidio de vivienda de tu caja de compensación',
  'Si trabajas y estás afiliado a una caja de compensación, puedes postularte a un subsidio para comprar vivienda de interés social.',
  'subsidy', '<VERIFICAR: caja de compensación>',
  '<VERIFICAR: enlace oficial de la caja>',
  '<VERIFICAR: página oficial de requisitos de la caja>',
  null, 18, null, null, null, null, null, 'hybrid',
  array[
    'Estar afiliado a una caja de compensación y al día con los aportes',
    'No tener vivienda propia',
    'No haber recibido antes otro subsidio de vivienda',
    '<VERIFICAR: topes de ingreso>'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- S5: completar solo si se confirma en fna.gov.co; si no, borrar esta fila.
-- E1
(
  'Ruta Bogotá Cundinamarca Emprende',
  'Acompañamiento gratuito de la Cámara de Comercio de Bogotá para crear o hacer crecer tu negocio: diagnóstico en línea, talleres y un consultor con plan de trabajo.',
  'entrepreneurship', 'Cámara de Comercio de Bogotá',
  'https://www.ccb.org.co/es/servicios/crea-tu-empresa/preparate-para-crear-tu-empresa/ruta-emprender',
  'https://www.ccb.org.co/es/servicios/crea-tu-empresa/preparate-para-crear-tu-empresa/ruta-emprender',
  null, 18, null, null, 'none', array['flexible']::public.availability[], null, 'hybrid',
  array[
    'Tener una idea de negocio o un emprendimiento en Bogotá o en un municipio de la jurisdicción de la CCB',
    'Hacer el diagnóstico en línea',
    'Comprometerte con los objetivos acordados con el consultor'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- E2
(
  'Maratón de Emprendimiento de la Cámara de Comercio de Bogotá',
  'Jornada gratuita e intensiva para emprendedores que quieren llevar su negocio al mercado, con asesorías y talleres en un solo día.',
  'entrepreneurship', 'Cámara de Comercio de Bogotá',
  '<VERIFICAR: formulario de registro de la jornada del 25 de noviembre>',
  'https://www.ccb.org.co/de-interes/noticias/maraton-de-emprendimiento',
  '2026-11-24', 18, null, null, 'none', null, '{11001}', 'in_person',
  array['Registrarte previamente en el formulario de la CCB', '<VERIFICAR: sede y hora>'],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- E3
(
  'Ruta Emprendedora del SENA',
  'Acompañamiento gratuito de asesores del SENA para convertir tu idea en un plan de negocio. Es el paso previo para presentarte al Fondo Emprender cuando abra convocatorias.',
  'entrepreneurship', 'Servicio Nacional de Aprendizaje (SENA) - Fondo Emprender',
  '<VERIFICAR: enlace de inscripción en fondoemprender.com>',
  'https://www.sena.edu.co/fondo-emprender-fortalece-las-capacidades-de-mas-negocios-a-traves-de-la-ruta-emprendedora',
  null, 18, null, null, 'none', array['flexible']::public.availability[], null, 'hybrid',
  array['<VERIFICAR: requisitos de inscripción>'],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- E4
(
  'Incubadora Futuras Startups',
  'Programa gratuito de tres meses de la Cámara de Comercio de Bogotá para startups de base tecnológica o científica, con asesorías, mentorías y un pitch day.',
  'entrepreneurship', 'Cámara de Comercio de Bogotá',
  'https://www.ccb.org.co/es/servicios/haz-crecer-tu-empresa/innovacion-empresarial/incubadora-de-futuras-startups',
  'https://www.ccb.org.co/es/servicios/haz-crecer-tu-empresa/innovacion-empresarial/incubadora-de-futuras-startups',
  '<VERIFICAR: cierre de la cohorte abierta>', 18, null, null, null, null, null, 'hybrid',
  array[
    'Tener una startup de base tecnológica o científica',
    'Estar en Bogotá o en un municipio de la jurisdicción de la CCB',
    '<VERIFICAR: demás requisitos de la cohorte>'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
),
-- E5
(
  'Emprendimiento Digital 2026: línea Modelo de Negocio',
  'Apoyo del Gobierno nacional para emprendimientos digitales que ya tienen un producto validado y ventas.',
  'entrepreneurship', 'iNNpulsa Colombia - Ministerio TIC',
  '<VERIFICAR: formulario de postulación vigente>',
  'https://www.innpulsacolombia.com/portfolio/gobierno-nacional-abre-convocatorias-para-fortalecer-entidades-de-apoyo-y-emprendimientos-digitales-del-pais/',
  '<VERIFICAR: fecha de cierre o null si es hasta agotar cupos>', 18, null, null, null, null, null, 'virtual',
  array[
    'Tener un emprendimiento digital con producto validado en el mercado',
    'Haber generado ventas',
    '<VERIFICAR: si exige persona jurídica y demás requisitos>'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana', '<VERIFICAR: fecha y hora de tu revisión>', 'active'
);
```
