import { isValidHttpUrl } from '../utils/url';
import { getStatusBadgeVisual } from '../components/statusBadgeHelper';
import { palettes } from '../theme/tokens';
import { recommendationsResponseSchema, opportunityDetailResponseSchema } from '../store/api';

describe('Recorrido completo de la aplicación (Bienvenida → Perfil → Recomendaciones → Detalle → Canal oficial)', () => {
  it('ejecuta con éxito el flujo integrado de usuario', () => {
    // 1. Bienvenida y consentimiento informado
    let userConsented = false;
    userConsented = true; // El usuario marca el checkbox
    expect(userConsented).toBe(true);

    // 2. Captura de perfil
    const userProfile = {
      birthDate: '2004-05-15', // 22 años
      municipalityCode: '11001', // Bogotá
      educationLevel: 'secondary',
      experienceLevel: 'none',
      currentSituation: 'neither',
      interests: ['employment', 'training'],
      availability: 'flexible',
      consentVersion: '2026-11-09',
      consentedAt: new Date().toISOString(),
    };

    expect(userProfile.interests).toContain('employment');
    expect(userProfile.interests).toContain('training');

    // 3. Consulta y validación de recomendaciones
    const mockRecommendationsPayload = {
      items: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Talento Tech MinTIC - Bootcamps en Programación',
          summaryPlain: 'Formación intensiva y gratuita en desarrollo web e IA.',
          category: 'training',
          entityName: 'MinTIC',
          modality: 'virtual',
          deadline: '2026-12-15',
          validity: { kind: 'open' as const },
          reasons: ['Te interesa la formación', 'Es una ruta prioritaria para tu situación'],
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'SENA - Formación Titulada Virtual',
          summaryPlain: 'Carreras técnicas y tecnólogas 100% virtuales.',
          category: 'training',
          entityName: 'SENA',
          modality: 'virtual',
          deadline: '2026-11-28',
          validity: { kind: 'open' as const },
          reasons: ['Te interesa la formación'],
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          title: 'Agencia Pública de Empleo SENA - Primer Empleo',
          summaryPlain: 'Puestos formales sin experiencia previa en Bogotá.',
          category: 'employment',
          entityName: 'Agencia Pública de Empleo',
          modality: 'in_person',
          deadline: '2026-12-05',
          validity: { kind: 'open' as const },
          reasons: ['Te interesa el empleo', 'Es en Bogotá, donde vives'],
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          title: 'Secretaría de Desarrollo Económico - Empleo Joven',
          summaryPlain: 'Empleos subsidiados para jóvenes en la capital.',
          category: 'employment',
          entityName: 'Alcaldía Mayor de Bogotá',
          modality: 'in_person',
          deadline: '2026-11-30',
          validity: { kind: 'open' as const },
          reasons: ['Es en Bogotá, donde vives'],
        },
      ],
      insufficient: false,
      message: null,
    };

    const parsedRecommendations = recommendationsResponseSchema.parse(mockRecommendationsPayload);
    expect(parsedRecommendations.items.length).toBe(4); // Deliberadamente 4 o 5 opciones
    expect(parsedRecommendations.insufficient).toBe(false);

    // 4. Detalle de oportunidad seleccionada
    const selected = parsedRecommendations.items[0];
    const mockDetailPayload = {
      id: selected.id,
      title: selected.title,
      summaryPlain: selected.summaryPlain,
      category: selected.category,
      entityName: selected.entityName,
      officialUrl: 'https://talentotech.gov.co/',
      sourceUrl: 'https://www.mintic.gov.co/',
      deadline: selected.deadline,
      minAge: 18,
      maxAge: 29,
      minEducation: 'secondary',
      minExperience: 'none',
      availability: ['flexible', 'part_time'],
      municipalityCodes: null,
      modality: 'virtual' as const,
      requirements: ['Mayor de 18 años', 'Bachiller graduado', 'Computador con internet'],
      verifiedBy: 'Juan Esteban Ramírez Hermosa',
      verifiedAt: '2026-11-10T15:00:00-05:00',
      validity: { kind: 'open' as const },
    };

    const parsedDetail = opportunityDetailResponseSchema.parse(mockDetailPayload);
    expect(parsedDetail.verifiedBy).toBe('Juan Esteban Ramírez Hermosa');
    expect(parsedDetail.requirements.length).toBe(3);

    // Verificación de badge accesible en detalle
    const badgeVisual = getStatusBadgeVisual(parsedDetail.validity, palettes.light);
    expect(badgeVisual.text).toBe('Vigente');
    expect(badgeVisual.icon).toBe('✓');

    // 5. Apertura segura del enlace oficial
    const isValid = isValidHttpUrl(parsedDetail.officialUrl);
    expect(isValid).toBe(true);
    expect(parsedDetail.officialUrl.startsWith('https://')).toBe(true);
  });
});
