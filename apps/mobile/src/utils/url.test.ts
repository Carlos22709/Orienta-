import { isValidHttpUrl } from './url';

describe('isValidHttpUrl (apertura segura de enlaces oficiales)', () => {
  it('acepta direcciones HTTPS válidas', () => {
    expect(isValidHttpUrl('https://sena.edu.co')).toBe(true);
    expect(isValidHttpUrl('https://talentotech.gov.co/ruta-ia')).toBe(true);
    expect(isValidHttpUrl('https://bogota.gov.co/empleo?id=123')).toBe(true);
  });

  it('acepta direcciones HTTP válidas', () => {
    expect(isValidHttpUrl('http://example.org')).toBe(true);
  });

  it('rechaza esquemas peligrosos o no permitidos', () => {
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:text/html,test')).toBe(false);
    expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
    expect(isValidHttpUrl('tel:+573001234567')).toBe(false);
  });

  it('rechaza cadenas vacías, nulos o valores indefinidos', () => {
    expect(isValidHttpUrl('')).toBe(false);
    expect(isValidHttpUrl('   ')).toBe(false);
    expect(isValidHttpUrl(null)).toBe(false);
    expect(isValidHttpUrl(undefined)).toBe(false);
    expect(isValidHttpUrl('no-es-una-url')).toBe(false);
  });
});
