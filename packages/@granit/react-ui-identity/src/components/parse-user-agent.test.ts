import { describe, expect, it } from 'vitest';

import { isHandheldUserAgent, parseUserAgent } from './parse-user-agent';

describe('parseUserAgent', () => {
  it('should return null for empty or nullish input', () => {
    expect(parseUserAgent(null)).toBeNull();
    expect(parseUserAgent(undefined)).toBeNull();
    expect(parseUserAgent('')).toBeNull();
  });

  it('should return null when neither browser nor OS is recognized', () => {
    expect(parseUserAgent('Mozilla/5.0')).toBeNull();
    expect(parseUserAgent('curl/8.4.0')).toBeNull();
  });

  it('should parse Chrome on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toEqual({
      kind: 'Browser',
      browser: 'Chrome',
      operatingSystem: 'Windows',
    });
  });

  it('should parse Safari on iOS', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(parseUserAgent(ua)).toEqual({
      kind: 'Browser',
      browser: 'Safari',
      operatingSystem: 'iOS',
    });
  });

  it('should prefer Edge over Chrome when both tokens are present', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0';
    expect(parseUserAgent(ua)?.browser).toBe('Edge');
  });

  it('should prefer Firefox on Android', () => {
    const ua = 'Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0';
    expect(parseUserAgent(ua)).toEqual({
      kind: 'Browser',
      browser: 'Firefox',
      operatingSystem: 'Android',
    });
  });

  it('should infer the Tv kind from a smart-TV agent', () => {
    const ua = 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 Chrome/76.0';
    expect(parseUserAgent(ua)?.kind).toBe('Tv');
  });

  it('should infer the Wearable kind from a watch agent', () => {
    const ua = 'Mozilla/5.0 (Apple Watch; CPU WatchOS 10_0 like Mac OS X) AppleWebKit/605.1.15';
    expect(parseUserAgent(ua)?.kind).toBe('Wearable');
  });

  it('should parse an OS even when the browser is unknown', () => {
    expect(parseUserAgent('SomeBot (Macintosh; Mac OS X)')).toEqual({
      kind: 'Browser',
      browser: null,
      operatingSystem: 'macOS',
    });
  });
});

describe('isHandheldUserAgent', () => {
  it('should be true for mobile operating systems', () => {
    expect(
      isHandheldUserAgent({ kind: 'Browser', browser: 'Safari', operatingSystem: 'iOS' })
    ).toBe(true);
    expect(
      isHandheldUserAgent({ kind: 'Browser', browser: 'Chrome', operatingSystem: 'Android' })
    ).toBe(true);
  });

  it('should be false for desktop operating systems and null input', () => {
    expect(
      isHandheldUserAgent({ kind: 'Browser', browser: 'Chrome', operatingSystem: 'Windows' })
    ).toBe(false);
    expect(isHandheldUserAgent(null)).toBe(false);
  });
});
