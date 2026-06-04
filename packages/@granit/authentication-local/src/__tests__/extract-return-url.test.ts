import { afterEach, describe, expect, it, vi } from 'vitest';

import { extractReturnUrl } from '../utils/extract-return-url';

describe('extractReturnUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts a simple relative returnUrl', () => {
    expect(extractReturnUrl('?returnUrl=%2Fdashboard')).toBe('/dashboard');
  });

  it('extracts a returnUrl with nested query parameters', () => {
    const search =
      '?returnUrl=%2Fconnect%2Fauthorize%3Fclient_id%3Dadmin%26redirect_uri%3Dhttps%253A%252F%252Fapp.local%252Fcallback';
    const result = extractReturnUrl(search);
    expect(result).toMatch(/^\/connect\/authorize\?client_id=admin/);
  });

  it('returns null when returnUrl is absent', () => {
    expect(extractReturnUrl('?foo=bar')).toBeNull();
  });

  it('returns null for an empty search string', () => {
    expect(extractReturnUrl('')).toBeNull();
  });

  it('returns null for an empty returnUrl value', () => {
    expect(extractReturnUrl('?returnUrl=')).toBeNull();
  });

  it('rejects absolute URLs (open redirect)', () => {
    expect(extractReturnUrl('?returnUrl=https%3A%2F%2Fevil.com')).toBeNull();
  });

  it('rejects protocol-relative URLs (open redirect)', () => {
    expect(extractReturnUrl('?returnUrl=%2F%2Fevil.com')).toBeNull();
  });

  it('rejects backslash-authority bypasses (open redirect)', () => {
    // Browsers normalise `\` → `/` in the authority, so these resolve
    // off-origin despite the leading single slash. See security audit VULN-202.
    expect(extractReturnUrl('?returnUrl=%2F%5Cevil.com')).toBeNull(); // /\evil.com
    expect(extractReturnUrl('?returnUrl=%5C%5Cevil.com')).toBeNull(); // \\evil.com
    expect(extractReturnUrl('?returnUrl=%2F%5C%2Fevil.com')).toBeNull(); // /\/evil.com
  });

  it('falls back to globalThis.location.search when no argument', () => {
    vi.stubGlobal('location', { search: '?returnUrl=%2Fhome' });
    expect(extractReturnUrl()).toBe('/home');
  });

  it('returns null when globalThis.location is undefined', () => {
    vi.stubGlobal('location', undefined);
    expect(extractReturnUrl()).toBeNull();
  });
});
