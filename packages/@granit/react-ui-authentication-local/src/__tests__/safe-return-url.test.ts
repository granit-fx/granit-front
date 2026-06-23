import { safeReturnUrl } from '../safe-return-url';

describe('safeReturnUrl', () => {
  it('should return the fallback for a null input', () => {
    expect(safeReturnUrl(null)).toBe('/login');
  });

  it('should return a custom fallback when provided', () => {
    expect(safeReturnUrl(null, '/')).toBe('/');
  });

  it('should return the fallback for an empty string', () => {
    expect(safeReturnUrl('')).toBe('/login');
  });

  it('should reject absolute http(s) URLs', () => {
    expect(safeReturnUrl('https://evil.tld/phish')).toBe('/login');
  });

  it('should reject non-http schemes', () => {
    expect(safeReturnUrl('javascript:alert(1)')).toBe('/login');
  });

  it('should reject protocol-relative URLs', () => {
    expect(safeReturnUrl('//evil.tld')).toBe('/login');
  });

  it('should reject backslash-escaped protocol-relative URLs', () => {
    expect(safeReturnUrl('/\\evil.tld')).toBe('/login');
  });

  it('should accept a same-origin relative path', () => {
    expect(safeReturnUrl('/connect/authorize')).toBe('/connect/authorize');
  });

  it('should accept the root path', () => {
    expect(safeReturnUrl('/')).toBe('/');
  });
});
