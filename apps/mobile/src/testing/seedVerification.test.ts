import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Verificación de las 11 oportunidades de empleo y formación (Curación de Juan - Decisión 0007)', () => {
  const seedPath = path.resolve(__dirname, '../../../../supabase/seed.sql');
  const seedContent = fs.readFileSync(seedPath, 'utf-8');

  it('el archivo seed.sql contiene el bloque de oportunidades de Juan Esteban Ramírez Hermosa', () => {
    expect(seedContent).toContain('Juan Esteban Ramírez Hermosa');
    expect(seedContent).toContain('Talento Tech MinTIC');
    expect(seedContent).toContain('SENA - Formación Titulada Virtual');
    expect(seedContent).toContain('Agencia Pública de Empleo SENA');
    expect(seedContent).toContain('Secretaría de Desarrollo Económico');
    expect(seedContent).toContain('MinTIC y SENA - SenaTIC');
    expect(seedContent).toContain('Agencia de Empleo Compensar');
    expect(seedContent).toContain('Alcaldía Municipal de Chía');
    expect(seedContent).toContain('Agencia de Empleo Colsubsidio');
    expect(seedContent).toContain('Cámara de Comercio de Bogotá y SENA');
    expect(seedContent).toContain('MinTIC - TuTIC');
    expect(seedContent).toContain('Alcaldía de Zipaquirá');
  });

  it('todas las oportunidades de Juan tienen los 5 chequeos de verificación en true', () => {
    // Busca las líneas con los valores de los 5 chequeos booleanos obligatorios
    const matches = seedContent.match(/true,\s*true,\s*true,\s*true,\s*true,\s*'Juan Esteban Ramírez Hermosa'/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(11); // Exactamente las 11 oportunidades curadas
  });

  it('todas las URLs oficiales y de fuente son HTTPS válidas', () => {
    const urls = seedContent.match(/'https:\/\/[^']+'/g);
    expect(urls).not.toBeNull();
    expect(urls!.length).toBeGreaterThanOrEqual(22); // Al menos 11 official_url y 11 source_url

    for (const urlStr of urls!) {
      const cleanUrl = urlStr.replace(/'/g, '');
      expect(cleanUrl.startsWith('https://')).toBe(true);
      expect(() => new URL(cleanUrl)).not.toThrow();
    }
  });

  it('todas las convocatorias de Juan pertenecen a las categorías asignadas (training o employment)', () => {
    const trainingMatches = seedContent.match(/'training',\s*'[^']+',\s*'https:\/\//g);
    const employmentMatches = seedContent.match(/'employment',\s*'[^']+',\s*'https:\/\//g);

    expect(trainingMatches).not.toBeNull();
    expect(employmentMatches).not.toBeNull();
    expect(trainingMatches!.length + employmentMatches!.length).toBe(11);
  });
});
