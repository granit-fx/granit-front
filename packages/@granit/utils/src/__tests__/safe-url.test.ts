import { describe, expect, it } from 'vitest';

import { LINK_URL_SCHEMES, NAV_URL_SCHEMES, assertSafeUrl, isSafeUrl } from '../safe-url.js';

describe('isSafeUrl', () => {
  it('accepts same-origin relative paths', () => {
    expect(isSafeUrl('/foo/bar')).toBe(true);
    expect(isSafeUrl('/')).toBe(true);
  });

  it('accepts http(s) absolute URLs', () => {
    expect(isSafeUrl('https://example.com/path')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('rejects protocol-relative URLs (open redirect)', () => {
    expect(isSafeUrl('//evil.com/path')).toBe(false);
  });

  it('rejects javascript: scheme (XSS)', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('JaVaScRiPt:alert(1)')).toBe(false);
  });

  it('rejects data: scheme', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript: scheme', () => {
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('rejects empty and non-string input', () => {
    expect(isSafeUrl('')).toBe(false);
    // @ts-expect-error — exercising defensive branch
    expect(isSafeUrl(null)).toBe(false);
    // @ts-expect-error — exercising defensive branch
    expect(isSafeUrl(undefined)).toBe(false);
  });

  it('accepts mailto/tel only when LINK_URL_SCHEMES is passed', () => {
    expect(isSafeUrl('mailto:a@b.c', LINK_URL_SCHEMES)).toBe(true);
    expect(isSafeUrl('tel:+33123456789', LINK_URL_SCHEMES)).toBe(true);
    expect(isSafeUrl('mailto:a@b.c', NAV_URL_SCHEMES)).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeUrl('http://[invalid')).toBe(false);
  });
});

describe('assertSafeUrl', () => {
  it('returns the input when safe', () => {
    expect(assertSafeUrl('https://example.com')).toBe('https://example.com');
    expect(assertSafeUrl('/relative')).toBe('/relative');
  });

  it('throws on unsafe URL with scheme in error message', () => {
    expect(() => assertSafeUrl('javascript:alert(1)')).toThrow(/Unsafe URL/);
  });

  it('throws on protocol-relative URL', () => {
    expect(() => assertSafeUrl('//evil.com')).toThrow(/Unsafe URL/);
  });

  it('truncates very long URLs in the error message', () => {
    const long = `javascript:${'a'.repeat(200)}`;
    expect(() => assertSafeUrl(long)).toThrow(/.{0,80}/);
  });

  it('coerces non-string input via String() in the error message', () => {
    // @ts-expect-error — exercising defensive branch (non-string sink input)
    expect(() => assertSafeUrl(null)).toThrow(/Unsafe URL rejected: "null"/);
  });
});
