-- =============================================================================
-- Datos semilla de Orienta+. Se cargan con: npx supabase db reset
--
-- Municipios en alcance (decisión 0004): Bogotá D. C. y Sabana Centro.
-- Fuente: DANE, "DIVIPOLA - Códigos municipios", publicado en datos.gov.co
-- (conjunto gdxc-w37w, campos cod_mpio, nom_mpio y dpto), consultado el
-- 2026-11-09 en https://www.datos.gov.co/resource/gdxc-w37w.json
-- Los códigos son los publicados; los nombres se escriben con mayúscula
-- inicial (la fuente los publica en mayúsculas sostenidas).
--
-- Las oportunidades reales se agregan aquí cuando el equipo las verifique
-- (decisión 0007). No se cargan oportunidades ficticias.
-- =============================================================================

insert into public.municipalities (code, name, department_name, in_scope)
values
  ('11001', 'Bogotá, D.C.', 'Bogotá, D.C.', true),
  ('25126', 'Cajicá', 'Cundinamarca', true),
  ('25175', 'Chía', 'Cundinamarca', true),
  ('25200', 'Cogua', 'Cundinamarca', true),
  ('25214', 'Cota', 'Cundinamarca', true),
  ('25295', 'Gachancipá', 'Cundinamarca', true),
  ('25486', 'Nemocón', 'Cundinamarca', true),
  ('25758', 'Sopó', 'Cundinamarca', true),
  ('25785', 'Tabio', 'Cundinamarca', true),
  ('25799', 'Tenjo', 'Cundinamarca', true),
  ('25817', 'Tocancipá', 'Cundinamarca', true),
  ('25899', 'Zipaquirá', 'Cundinamarca', true)
on conflict (code) do update
  set name = excluded.name,
      department_name = excluded.department_name,
      in_scope = excluded.in_scope;

-- =============================================================================
-- Oportunidades curadas y verificadas por Juan Esteban Ramírez Hermosa
-- (Decisión 0007: Categorías de Empleo y Formación para Bogotá y Sabana Centro)
-- =============================================================================

insert into public.opportunities (
  title,
  summary_plain,
  category,
  entity_name,
  official_url,
  source_url,
  deadline,
  min_age,
  max_age,
  min_education,
  min_experience,
  availability,
  municipality_codes,
  modality,
  requirements,
  check_official_source,
  check_entity_real,
  check_current,
  check_requirements_complete,
  check_official_link,
  verified_by,
  verified_at,
  status
) values
(
  'Talento Tech MinTIC - Bootcamps en Programación e Inteligencia Artificial',
  'Formación intensiva y gratuita en desarrollo web, inteligencia artificial y ciencia de datos con certificación oficial del MinTIC.',
  'training',
  'Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC)',
  'https://talentotech.gov.co/',
  'https://www.mintic.gov.co/portal/inicio/',
  '2026-12-15',
  18,
  29,
  'secondary',
  'none',
  array['flexible', 'part_time']::public.availability[],
  null,
  'virtual',
  array['Tener entre 18 y 29 años', 'Título de bachiller en Colombia', 'Disponer de computador e internet', 'Superar prueba básica de habilidades cognitivas'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'SENA - Formación Titulada Virtual Técnicos y Tecnólogos',
  'Carreras técnicas y tecnólogas 100% virtuales y gratuitas en desarrollo de software, gestión comunitaria y contabilidad empresarial.',
  'training',
  'Servicio Nacional de Aprendizaje (SENA)',
  'https://oferta.senasofiaplus.edu.co/sofia-oferta/',
  'https://www.sena.edu.co/',
  '2026-11-28',
  18,
  29,
  'secondary',
  'none',
  array['flexible']::public.availability[],
  null,
  'virtual',
  array['Mayor de 18 años', 'Bachiller graduado y documento de identidad', 'Prueba Saber 11 para nivel tecnólogo', 'Manejo básico de herramientas informáticas'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Agencia Pública de Empleo SENA - Vacantes Primer Empleo Bogotá',
  'Puestos de trabajo formal sin experiencia previa para jóvenes en servicio al cliente, operaciones logísticas y digitación en Bogotá.',
  'employment',
  'Agencia Pública de Empleo del SENA',
  'https://agenciapublicadeempleo.sena.edu.co/',
  'https://agenciapublicadeempleo.sena.edu.co/',
  '2026-12-05',
  18,
  28,
  'secondary',
  'none',
  array['full_time']::public.availability[],
  array['11001'],
  'in_person',
  array['Edad de 18 a 28 años', 'Bachiller académico graduado', 'Hoja de vida registrada en el portal APE', 'Residir en Bogotá D. C.'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Secretaría de Desarrollo Económico - Programa Empleo Joven Distrito Capital',
  'Iniciativa distrital que subsidia y conecta empleos formales para jóvenes bachilleres o técnicos en empresas aliadas de la capital.',
  'employment',
  'Alcaldía Mayor de Bogotá - Secretaría Distrital de Desarrollo Económico',
  'https://bogotatrabaja.gov.co/',
  'https://desarrolloeconomico.gov.co/',
  '2026-11-30',
  18,
  28,
  'secondary',
  'none',
  array['full_time', 'flexible']::public.availability[],
  array['11001'],
  'in_person',
  array['Jóvenes entre 18 y 28 años', 'Residir en Bogotá D. C.', 'No contar con empleo formal vigente al postularse', 'Documento de identidad al día'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'MinTIC y SENA - SenaTIC Certificaciones Cloud e Inteligencia Artificial',
  'Rutas gratuitas de certificación técnica en computación en la nube, soporte de redes y análisis de datos en convenio con gigantes tecnológicos.',
  'training',
  'Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC)',
  'https://senatic.mintic.gov.co/',
  'https://www.mintic.gov.co/',
  '2026-12-31',
  18,
  29,
  'secondary',
  'none',
  array['flexible', 'part_time']::public.availability[],
  null,
  'virtual',
  array['Nacionalidad colombiana', 'Mayor de 18 años', 'Conectividad a internet y computador', 'Compromiso de culminación de módulos'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Agencia de Empleo Compensar - Convocatoria Joven Sabana Centro',
  'Oportunidades de vinculación laboral en plantas de producción y parques empresariales de Sabana Centro para perfiles técnicos y tecnólogos.',
  'employment',
  'Caja de Compensación Familiar Compensar',
  'https://www.compensar.com/',
  'https://agenciadeempleocompensar.com/',
  '2026-11-25',
  18,
  29,
  'technical',
  'lt_1y',
  array['full_time']::public.availability[],
  array['25126', '25175', '25214', '25817', '25899'],
  'in_person',
  array['Edad entre 18 y 29 años', 'Título técnico o tecnólogo afín a logística, operaciones o administración', 'Residencia comprobable en municipios de Sabana Centro', 'Disponibilidad para turnos rotativos'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Alcaldía Municipal de Chía - Escuela de Empleabilidad Juvenil',
  'Talleres prácticos en atención al cliente, marketing digital básico y preparación para entrevistas de trabajo en el municipio de Chía.',
  'training',
  'Alcaldía Municipal de Chía - Dirección de Desarrollo Económico',
  'https://www.chia-cundinamarca.gov.co/',
  'https://www.chia-cundinamarca.gov.co/',
  '2026-12-10',
  18,
  28,
  'secondary',
  'none',
  array['part_time', 'weekends']::public.availability[],
  array['25175'],
  'hybrid',
  array['Residir en el municipio de Chía', 'Edad entre 18 y 28 años', 'Certificado de Sisbén o residencia local', 'Compromiso de asistencia a sesiones presenciales'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Agencia de Empleo Colsubsidio - Vacantes Operativas y Administrativas Sabana',
  'Vacantes de auxiliares de bodega, atención en puntos de venta y digitación en Bogotá y municipios del norte de la Sabana.',
  'employment',
  'Caja Colombiana de Subsidio Familiar Colsubsidio',
  'https://www.colsubsidio.com/',
  'https://www.colsubsidio.com/',
  '2026-12-20',
  18,
  29,
  'secondary',
  'none',
  array['full_time']::public.availability[],
  array['11001', '25175', '25817'],
  'in_person',
  array['Mayor de 18 años', 'Bachiller completo con diploma o acta', 'Hoja de vida registrada en el Servicio Público de Empleo', 'Disponibilidad inmediata'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Cámara de Comercio de Bogotá y SENA - Inglés para la Inserción Laboral',
  'Curso interactivo para fortalecer el inglés conversacional aplicado a empresas de servicios y atención al cliente global.',
  'training',
  'Cámara de Comercio de Bogotá',
  'https://www.ccb.org.co/',
  'https://www.ccb.org.co/',
  '2026-11-22',
  18,
  29,
  'secondary',
  'none',
  array['part_time', 'flexible']::public.availability[],
  array['11001', '25126', '25175', '25899'],
  'virtual',
  array['Jóvenes bachilleres de 18 a 29 años', 'Residir en Bogotá o municipios de la jurisdicción CCB', 'Disponer de 8 horas semanales', 'Conexión a internet'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'MinTIC - TuTIC Ruta de Habilidades Digitales y Empleabilidad',
  'Cursos cortos 100% virtuales y gratuitos para aprender a usar herramientas digitales en el trabajo y crear tu hoja de vida digital.',
  'training',
  'Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC)',
  'https://tutic.gov.co/',
  'https://www.mintic.gov.co/',
  null,
  18,
  29,
  'secondary_incomplete',
  'none',
  array['flexible']::public.availability[],
  null,
  'virtual',
  array['Ciudadano colombiano', 'Mayor de 18 años', 'Acceso a internet desde computador o celular'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
),
(
  'Alcaldía de Zipaquirá - Rueda de Empleo Juvenil Sabana Norte',
  'Jornada de intermediación laboral para jóvenes bachilleres y técnicos en sectores de comercio, agroindustria y hotelería en Sabana Norte.',
  'employment',
  'Alcaldía Municipal de Zipaquirá - Secretaría de Desarrollo Económico',
  'https://www.zipaquira-cundinamarca.gov.co/',
  'https://www.zipaquira-cundinamarca.gov.co/',
  '2026-11-18',
  18,
  29,
  'secondary',
  'none',
  array['full_time']::public.availability[],
  array['25899', '25200', '25486'],
  'in_person',
  array['Jóvenes entre 18 y 29 años', 'Residir en Zipaquirá, Cogua o Nemocón', 'Cédula de ciudadanía física o digital', 'Hoja de vida con soportes académicos'],
  true, true, true, true, true,
  'Juan Esteban Ramírez Hermosa',
  '2026-11-10T15:00:00-05:00',
  'active'
);

-- -----------------------------------------------------------------------------
-- Subsidios y emprendimiento (curación de Carlos, decisión 0007).
-- Datos tomados de las páginas oficiales enlazadas, leídas el 2026-11-11.
-- Montos y condiciones según la fuente; si cambian, se actualizan aquí.
-- Detalle y descartadas: docs/curacion/candidatas-carlos-subsidios-emprendimiento.md
-- -----------------------------------------------------------------------------
insert into public.opportunities (
  title, summary_plain, category, entity_name, official_url, source_url,
  deadline, min_age, max_age, min_education, min_experience, availability,
  municipality_codes, modality, requirements,
  check_official_source, check_entity_real, check_current,
  check_requirements_complete, check_official_link,
  verified_by, verified_at, status
) values
(
  'Incentivo Sisbén en los pasajes de TransMilenio y SITP',
  'Si tienes el Sisbén IV de Bogotá en los grupos A1 a B7, recibes un incentivo en tus pasajes de TransMilenio, TransMiCable y SITP con tu tarjeta TuLlave personalizada.',
  'subsidy',
  'TransMilenio S.A. - Alcaldía de Bogotá',
  'https://www.transmilenio.gov.co/viaje-en-transmi/medios-de-pago/tarifas-del-sistema-transmilenio',
  'https://bogota.gov.co/mi-ciudad/movilidad/descuento-en-tarifa-de-transporte-publico-por-pertenecer-al-sisben',
  null,
  null,
  null,
  null,
  null,
  null,
  array['11001'],
  'in_person',
  array[
    'Tener la encuesta del Sisbén IV validada en Bogotá, en los grupos A1 a B7',
    'Personalizar tu tarjeta TuLlave con tu documento en un punto de personalización',
    'Si no apareces en el Sisbén, solicitar la encuesta a la Secretaría Distrital de Planeación',
    'El incentivo es personal e intransferible'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-11T23:50:00-05:00',
  'active'
),
(
  'Ahorro para mi Casa: subsidio para comprar vivienda en Bogotá',
  'Subsidio de la Secretaría del Hábitat para ahorrar y comprar vivienda en Bogotá: hasta $13.026.733 pagados en 12 cuotas. Da prioridad a hogares cuyo jefe es una persona joven.',
  'subsidy',
  'Secretaría Distrital del Hábitat - Alcaldía de Bogotá',
  'https://www.habitatbogota.gov.co/transparencia/tramites-servicios/acceso-vivienda/ahorro-para-mi-casa',
  'https://bogota.gov.co/mi-ciudad/habitat/subsidios-de-vivienda-programa-mi-casa-en-bogota-requisitos-2026',
  null,
  18,
  null,
  null,
  null,
  null,
  array['11001'],
  'hybrid',
  array[
    'Ser mayor de edad (jefe o jefa de hogar)',
    'Ingresos mensuales del hogar de hasta $3.501.810 (valor 2026)',
    'No ser propietario de vivienda en Colombia',
    'No haber recibido antes un subsidio de vivienda aplicado',
    'Tener cierre financiero para la compra de la vivienda'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-11T23:50:00-05:00',
  'active'
),
(
  -- No es un subsidio en dinero sino un crédito con beneficio en la tasa; se
  -- clasifica como subsidio porque es la categoría más cercana y el resumen
  -- lo aclara.
  'Generación FNA: crédito de vivienda para jóvenes',
  'Crédito hipotecario o leasing habitacional del Fondo Nacional del Ahorro para jóvenes, con una tasa 0,5 puntos más baja que la vigente. No es un subsidio en dinero: es un crédito con beneficio.',
  'subsidy',
  'Fondo Nacional del Ahorro (FNA)',
  'https://www.fna.gov.co/personas/programas/generacion-fna',
  'https://www.fna.gov.co/personas/programas/generacion-fna',
  null,
  18,
  28,
  null,
  null,
  null,
  null,
  'hybrid',
  array[
    'Tener entre 18 y 28 años (hasta 28 años y 364 días al radicar el crédito)',
    'Estar afiliado al FNA por cesantías o por Ahorro Voluntario Contractual (AVC)',
    'Acreditar la afiliación antes de cumplir 28 años y pedir el crédito antes de cumplir 30',
    'Aplica para crédito hipotecario y leasing habitacional'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-11T23:50:00-05:00',
  'active'
),
(
  'Ruta Ágil de Emprendimiento de la Cámara de Comercio de Bogotá',
  'Talleres virtuales gratuitos y acompañamiento de un consultor para estructurar tu idea de negocio: modelo de negocio, costos, aspectos legales y un primer prototipo. La inscripción está abierta todo el año.',
  'entrepreneurship',
  'Cámara de Comercio de Bogotá',
  'https://www.ccb.org.co/es/servicios/crea-tu-empresa/preparate-para-crear-tu-empresa/ruta-emprender',
  'https://www.ccb.org.co/es/servicios/crea-tu-empresa/preparate-para-crear-tu-empresa/ruta-emprender',
  null,
  18,
  null,
  null,
  'none',
  null,
  null,
  'virtual',
  array[
    'Tener una idea de negocio que quieras estructurar',
    'Hacer el diagnóstico para emprender en la plataforma de la CCB o llenar el formulario web de inscripción',
    'Aceptar los términos y condiciones del programa',
    'Dedicar entre 8 y 12 horas a las sesiones, más trabajo autónomo'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-11T23:50:00-05:00',
  'active'
),
(
  'Incubadora Futuras Startups de la Cámara de Comercio de Bogotá',
  'Programa gratuito de tres meses para emprendimientos de base tecnológica o científica: te acompañan a construir tu producto mínimo viable y termina con un pitch day. El próximo grupo empieza en enero de 2027.',
  'entrepreneurship',
  'Cámara de Comercio de Bogotá',
  'https://www.ccb.org.co/es/servicios/haz-crecer-tu-empresa/innovacion-empresarial/incubadora-de-futuras-startups',
  'https://www.ccb.org.co/es/servicios/haz-crecer-tu-empresa/innovacion-empresarial/incubadora-de-futuras-startups',
  null,
  18,
  null,
  null,
  'none',
  null,
  null,
  'hybrid',
  array[
    'Tener un emprendimiento o idea de negocio de base tecnológica o científica',
    'Estar en Bogotá o en uno de los 59 municipios de la jurisdicción de la Cámara de Comercio de Bogotá',
    'Llenar el formulario de inscripción; no necesitas ventas previas ni registro mercantil'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-11T23:50:00-05:00',
  'active'
);

-- -----------------------------------------------------------------------------
-- Becas y financiación de estudios (curación de Carlos, que asumió esta parte
-- del reparto de la decisión 0007). Datos tomados de las páginas oficiales
-- enlazadas, leídas el 2026-11-12. ICETEX y Colfuturo financian estudios con
-- crédito; el resumen lo aclara.
-- -----------------------------------------------------------------------------
insert into public.opportunities (
  title, summary_plain, category, entity_name, official_url, source_url,
  deadline, min_age, max_age, min_education, min_experience, availability,
  municipality_codes, modality, requirements,
  check_official_source, check_entity_real, check_current,
  check_requirements_complete, check_official_link,
  verified_by, verified_at, status
) values
(
  'Jóvenes a la E 6: apoyo para estudiar en instituciones públicas',
  'Si eres bachiller de Bogotá y te admitieron para empezar en 2027-1 en la Universidad Nacional, la Distrital, la Pedagógica, la ETITC o el SENA, puedes recibir hasta un salario mínimo por periodo académico para sostenerte, además de apoyos como transporte.',
  'scholarship',
  'Agencia Distrital para la Educación Superior, la Ciencia y la Tecnología (Atenea)',
  'https://sicore.agenciaatenea.gov.co/',
  'https://agenciaatenea.gov.co/convocatorias/convocatoria-jovenes-la-e-6-educacion-superior-en-instituciones-publicas',
  '2026-11-13',
  null,
  null,
  'secondary',
  null,
  null,
  array['11001'],
  'in_person',
  array[
    'Ser bachiller de Bogotá',
    'Haber sido admitido para empezar en 2027-1 en la Universidad Nacional, la Universidad Distrital, la Universidad Pedagógica Nacional, la ETITC o el SENA Regional Distrito Capital',
    'Inscribirte en la plataforma SICORE de Atenea antes del 13 de noviembre de 2026 a las 11:59 p. m.'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-12T00:05:00-05:00',
  'active'
),
(
  'Jóvenes a la E 6: matrícula y apoyo para estudiar en instituciones privadas',
  'Beca de Bogotá para empezar la educación superior en 2027-1: Atenea paga la matrícula directamente a la institución y te da un apoyo de hasta un salario mínimo por periodo académico.',
  'scholarship',
  'Agencia Distrital para la Educación Superior, la Ciencia y la Tecnología (Atenea)',
  'https://sicore.agenciaatenea.gov.co/',
  'https://agenciaatenea.gov.co/convocatorias/convocatoria-jovenes-la-e-6-educacion-superior-en-instituciones-privadas',
  '2026-11-18',
  null,
  28,
  'secondary',
  null,
  null,
  array['11001'],
  'in_person',
  array[
    'Ser bachiller de Bogotá o estar en grado once (calendario A)',
    'Tener hasta 28 años',
    'Inscribirte en la plataforma SICORE de Atenea entre el 12 y el 18 de noviembre de 2026'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-12T00:05:00-05:00',
  'active'
),
(
  -- El Ministerio publica dos páginas con criterios distintos de edad: la
  -- guía actualizada en 2025 dice 14 a 28 años y un comunicado de 2024 dice
  -- que no hay límite. Se usa la guía más reciente.
  'Matrícula Cero: estudia gratis tu pregrado en una institución pública',
  'Política de Gratuidad del Gobierno nacional: si estudias pregrado en una institución pública con convenio, el Gobierno paga tu matrícula ordinaria. No hay que pedirla aparte: la institución te registra al matricularte.',
  'scholarship',
  'Ministerio de Educación Nacional',
  'https://www.mineducacion.gov.co/portal/Educacion-superior/Politica-de-Gratuidad-Puedo-Estudiar/409830:Politica-de-Gratuidad-en-la-Educacion-Superior',
  'https://www.mineducacion.gov.co/portal/salaprensa/Comunicados/420611:Como-acceder-a-la-Politica-de-Gratuidad-Puedo-Estudiar-Conoce-el-paso-a-paso',
  null,
  null,
  28,
  'secondary',
  null,
  null,
  null,
  'hybrid',
  array[
    'Tener nacionalidad colombiana',
    'Estar en el Sisbén IV en los grupos A, B o C (o en uno de los grupos especiales que define el Ministerio)',
    'Matricularte en un pregrado con registro calificado en una institución pública con convenio',
    'No tener título profesional universitario ni de posgrado'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-12T00:05:00-05:00',
  'active'
),
(
  'Crédito educativo ICETEX para estudiar en 2027-1',
  'El ICETEX abrió su convocatoria de créditos para pregrado, posgrado y formación para el trabajo en 2027-1. Es un préstamo, no una beca: financia hasta el 100 % de la matrícula y una parte se paga durante los estudios.',
  'scholarship',
  'ICETEX',
  'https://web.icetex.gov.co/creditos/planes-de-financiacion',
  'https://bogota.gov.co/mi-ciudad/educacion/2026-10/nueva-convocatoria-para-creditos-educativos-del-icetex-para-2027',
  null,
  null,
  null,
  'secondary',
  null,
  null,
  null,
  'virtual',
  array[
    'Diligenciar la solicitud en la página del ICETEX (crédito educativo)',
    'Descargar el formulario, firmarlo, poner tu huella y adjuntarlo en el enlace que llega por correo',
    'El trámite no tiene costo y se hace directamente, sin intermediarios'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-12T00:05:00-05:00',
  'active'
),
(
  'Crédito-Beca COLFUTURO 2027 para posgrado en el exterior',
  'Financiación de COLFUTURO para hacer una maestría o un doctorado fuera del país. La convocatoria 2027 recibe postulaciones del 4 de enero al 4 de marzo de 2027.',
  'scholarship',
  'COLFUTURO',
  'https://www.colfuturo.org/programas/credito-beca/convocatoria',
  'https://www.colfuturo.org/programas/credito-beca/convocatoria',
  '2027-03-04',
  null,
  null,
  'university',
  null,
  null,
  null,
  'virtual',
  array[
    'Ser colombiano',
    'Tener un título de pregrado',
    'Presentar el programa de posgrado que te interesa y un escrito',
    'Postularte entre el 4 de enero y el 4 de marzo de 2027',
    'Al legalizar, certificar el dominio de un segundo idioma'
  ],
  true, true, true, true, true,
  'Carlos Augusto Sánchez Lombana',
  '2026-11-12T00:05:00-05:00',
  'active'
);
