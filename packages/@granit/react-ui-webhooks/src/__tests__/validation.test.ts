import { describe, expect, it } from 'vitest';

import { validateTargetUrl } from '../validation';

// Identity translate stub: the returned value equals the i18n key, so assertions
// can check which client-only SSRF guard fired. Empty/maxLength are owned by the
// spec resolver and are not exercised here.
const t = (key: string) => key;

describe('validateTargetUrl', () => {
  it('accepts a valid HTTPS URL', () => {
    expect(validateTargetUrl('https://api.partner.com/webhooks', t)).toBeUndefined();
  });

  it('accepts a valid HTTPS URL with custom port', () => {
    expect(validateTargetUrl('https://api.partner.com:8443/webhooks', t)).toBeUndefined();
  });

  it('skips an empty URL (left to the spec required check)', () => {
    expect(validateTargetUrl('', t)).toBeUndefined();
  });

  it('rejects an unparseable URL', () => {
    expect(validateTargetUrl('not-a-url', t)).toBe('Webhooks.Form.TargetUrlInvalid');
  });

  it('rejects HTTP URLs (requires HTTPS)', () => {
    expect(validateTargetUrl('http://api.partner.com/webhooks', t)).toBe(
      'Webhooks.Form.TargetUrlHttps'
    );
  });

  it('rejects localhost URLs (SSRF protection)', () => {
    expect(validateTargetUrl('https://localhost:3000/hook', t)).toBe(
      'Webhooks.Form.TargetUrlPrivate'
    );
  });

  it('rejects 127.0.0.1 URLs (SSRF protection)', () => {
    expect(validateTargetUrl('https://127.0.0.1:8080/hook', t)).toBe(
      'Webhooks.Form.TargetUrlPrivate'
    );
  });

  it('rejects 10.x private network URLs', () => {
    expect(validateTargetUrl('https://10.0.0.5/hook', t)).toBe('Webhooks.Form.TargetUrlPrivate');
  });

  it('rejects 192.168.x private network URLs', () => {
    expect(validateTargetUrl('https://192.168.1.1/hook', t)).toBe('Webhooks.Form.TargetUrlPrivate');
  });

  it('rejects 172.16-31.x private network URLs', () => {
    expect(validateTargetUrl('https://172.16.0.1/hook', t)).toBe('Webhooks.Form.TargetUrlPrivate');
  });

  it('rejects IPv6 link-local URLs (fe80::)', () => {
    expect(validateTargetUrl('https://[fe80::1]/hook', t)).toBe('Webhooks.Form.TargetUrlPrivate');
  });

  it('rejects IPv6 unique-local URLs (fc00::/fd00::)', () => {
    for (const addr of ['[fc00::1]', '[fd12::1]']) {
      expect(validateTargetUrl(`https://${addr}/hook`, t)).toBe('Webhooks.Form.TargetUrlPrivate');
    }
  });

  it('rejects cloud metadata IP (169.254.169.254)', () => {
    expect(validateTargetUrl('https://169.254.169.254/latest/meta-data/', t)).toBe(
      'Webhooks.Form.TargetUrlPrivate'
    );
  });

  it('rejects .local/.internal/.localhost TLDs', () => {
    for (const host of ['server.local', 'api.internal', 'app.localhost']) {
      expect(validateTargetUrl(`https://${host}/hook`, t)).toBe('Webhooks.Form.TargetUrlPrivate');
    }
  });
});
