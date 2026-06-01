import { describe, expect, it } from 'vitest';

import { urlBase64ToUint8Array } from '../utils/vapid';

describe('urlBase64ToUint8Array', () => {
  it('should convert a URL-safe base64 string to Uint8Array', () => {
    // Standard VAPID public key (65 bytes for P-256)
    const base64 =
      'BNbxGYNMhE-4OjcSMgeaSRORgOGFbi42PfHBFpCbXxJCe-FGT-PKmGdR4QY0IH7n-E5S5i8_sUgWJPlsp6jMYs';
    const result = urlBase64ToUint8Array(base64);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(64);
  });

  it('should handle base64 strings that need padding', () => {
    // "test" in URL-safe base64 without padding = "dGVzdA"
    const result = urlBase64ToUint8Array('dGVzdA');

    expect(result).toBeInstanceOf(Uint8Array);
    // "test" = 4 bytes
    expect(result.length).toBe(4);
    expect(result[0]).toBe(116); // 't'
    expect(result[1]).toBe(101); // 'e'
    expect(result[2]).toBe(115); // 's'
    expect(result[3]).toBe(116); // 't'
  });

  it('should replace URL-safe characters with standard base64 characters', () => {
    // A string with - and _ (URL-safe base64 replacements for + and /)
    const urlSafe = 'ab-cd_ef';
    const result = urlBase64ToUint8Array(urlSafe);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});
