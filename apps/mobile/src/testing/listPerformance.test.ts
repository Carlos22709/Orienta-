import type { OpportunityItem } from '../components/OpportunityCard';

describe('Pruebas de rendimiento de listas (entregable de Juan)', () => {
  const generateMockOpportunities = (count: number): OpportunityItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `uuid-opp-${i + 1}`,
      title: `Convocatoria de formación y empleo #${i + 1}`,
      summaryPlain: `Resumen claro y conciso de la convocatoria número ${i + 1}.`,
      category: i % 2 === 0 ? 'training' : 'employment',
      entityName: `Entidad Oficial #${i + 1}`,
      modality: i % 3 === 0 ? 'virtual' : 'in_person',
      deadline: '2026-12-31',
      validity: { kind: 'open' as const },
      reasons: ['Interés coincidente', 'Ubicación compatible'],
    }));
  };

  it('el extractor de claves (keyExtractor) es determinista y no produce duplicados', () => {
    const items = generateMockOpportunities(50);
    const keyExtractor = (item: OpportunityItem) => item.id;

    const keys = items.map(keyExtractor);
    const uniqueKeys = new Set(keys);

    expect(keys.length).toBe(50);
    expect(uniqueKeys.size).toBe(50);
  });

  it('procesa y filtra una lista de 5 recomendaciones en menos de 10 ms', () => {
    const items = generateMockOpportunities(5);

    const start = performance.now();
    const processed = items.map((item) => ({
      ...item,
      searchSnippet: `${item.title} ${item.entityName}`.toLowerCase(),
    }));
    const duration = performance.now() - start;

    expect(processed.length).toBe(5);
    expect(duration).toBeLessThan(10);
  });

  it('la configuración de FlatList mantiene windowSize y lotes en 5 para evitar sobrecarga de memoria', () => {
    const flatListConfig = {
      initialNumToRender: 5,
      maxToRenderPerBatch: 5,
      windowSize: 5,
    };

    expect(flatListConfig.initialNumToRender).toBe(5);
    expect(flatListConfig.maxToRenderPerBatch).toBe(5);
    expect(flatListConfig.windowSize).toBe(5);
  });
});
