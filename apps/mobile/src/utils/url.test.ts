import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidHttpUrl } from './url';

test('isValidHttpUrl acepta direcciones HTTPS válidas', () => {
  assert.equal(isValidHttpUrl('https://sena.edu.co'), true);
  assert.equal(isValidHttpUrl('https://talentotech.gov.co/ruta-ia'), true);
  assert.equal(isValidHttpUrl('https://bogota.gov.co/empleo?id=123'), true);
});

test('isValidHttpUrl acepta direcciones HTTP válidas', () => {
  assert.equal(isValidHttpUrl('http://example.org'), true);
});

test('isValidHttpUrl rechaza esquemas peligrosos o no permitidos', () => {
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('data:text/html,test'), false);
  assert.equal(isValidHttpUrl('file:///etc/passwd'), false);
  assert.equal(isValidHttpUrl('tel:+573001234567'), false);
});

test('isValidHttpUrl rechaza cadenas vacías, nulos o valores indefinidos', () => {
  assert.equal(isValidHttpUrl(''), false);
  assert.equal(isValidHttpUrl('   '), false);
  assert.equal(isValidHttpUrl(null), false);
  assert.equal(isValidHttpUrl(undefined), false);
  assert.equal(isValidHttpUrl('no-es-una-url'), false);
});
