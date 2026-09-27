import { describe, expect, it } from 'vitest';
import { safeNextPath } from '@/lib/auth/safe-next';

describe('safeNextPath', () => {
  it('conserva las rutas internas con su query y su hash', () => {
    expect(safeNextPath('/vault')).toBe('/vault');
    expect(safeNextPath('/brain?q=rodilla#nota')).toBe('/brain?q=rodilla#nota');
  });

  it('usa el valor por defecto si no hay destino', () => {
    expect(safeNextPath(null)).toBe('/home');
    expect(safeNextPath(undefined)).toBe('/home');
    expect(safeNextPath('')).toBe('/home');
    expect(safeNextPath(null, '/settings')).toBe('/settings');
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'javascript:alert(1)',
    'evil.com/home',
  ])('rechaza el destino externo %j', (next) => {
    expect(safeNextPath(next)).toBe('/home');
  });
});
