import { afterEach, describe, expect, it } from 'vitest';

import { defaultConsentState } from '../consent-state';
import { getCookie, removeCookie, setConsentedCookie } from '../cookie-store';

import type { ConsentState } from '../types/index';

function clearAllCookies(): void {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

afterEach(clearAllCookies);

describe('setConsentedCookie', () => {
  it('writes a strictly_necessary cookie regardless of consent', () => {
    const consents: ConsentState = { ...defaultConsentState(), strictly_necessary: true };

    const written = setConsentedCookie('session', 'abc', {
      category: 'strictly_necessary',
      consents,
    });

    expect(written).toBe(true);
    expect(getCookie('session')).toBe('abc');
  });

  it('writes an optional cookie when its category is granted', () => {
    const consents: ConsentState = { ...defaultConsentState(), analytics: true };

    const written = setConsentedCookie('analytics_id', 'xyz', {
      category: 'analytics',
      consents,
    });

    expect(written).toBe(true);
    expect(getCookie('analytics_id')).toBe('xyz');
  });

  it('does NOT write when the category is denied', () => {
    const written = setConsentedCookie('mkt', 'tracking', {
      category: 'marketing',
      consents: defaultConsentState(),
    });

    expect(written).toBe(false);
    expect(getCookie('mkt')).toBeNull();
  });

  it('encodes name and value', () => {
    setConsentedCookie('a b', 'x;y=z', {
      category: 'strictly_necessary',
      consents: defaultConsentState(),
    });

    expect(document.cookie).toContain('a%20b=x%3By%3Dz');
    expect(getCookie('a b')).toBe('x;y=z');
  });
});

describe('getCookie', () => {
  it('returns null for an absent cookie', () => {
    expect(getCookie('nope')).toBeNull();
  });

  it('reads a value written directly', () => {
    document.cookie = 'plain=value; Path=/';
    expect(getCookie('plain')).toBe('value');
  });
});

describe('removeCookie', () => {
  it('deletes a previously written cookie', () => {
    setConsentedCookie('tmp', '1', {
      category: 'strictly_necessary',
      consents: defaultConsentState(),
    });
    expect(getCookie('tmp')).toBe('1');

    removeCookie('tmp');
    expect(getCookie('tmp')).toBeNull();
  });
});
