import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDefaultPasskeyName } from './passkey-device-name';

interface UADataBrand {
  brand: string;
  version: string;
}

function stubNavigator(value: {
  userAgent?: string;
  userAgentData?: { brands?: UADataBrand[]; platform?: string };
}) {
  vi.stubGlobal('navigator', value as Navigator);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getDefaultPasskeyName', () => {
  it('prefers Client Hints brands and platform, normalising the brand alias', () => {
    stubNavigator({
      userAgent: 'ignored',
      userAgentData: {
        brands: [
          { brand: 'Not.A/Brand', version: '99' },
          { brand: 'Chromium', version: '120' },
          { brand: 'Google Chrome', version: '120' },
        ],
        platform: 'Windows',
      },
    });

    expect(getDefaultPasskeyName()).toBe('Chrome – Windows');
  });

  it('falls back to "Chromium" when only GREASE and engine brands are present', () => {
    stubNavigator({
      userAgentData: {
        brands: [{ brand: 'Chromium', version: '120' }],
        platform: 'Linux',
      },
    });

    expect(getDefaultPasskeyName()).toBe('Chromium – Linux');
  });

  it('parses the userAgent string when Client Hints are unavailable (Safari)', () => {
    stubNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });

    expect(getDefaultPasskeyName()).toBe('Safari – macOS');
  });

  it('detects iOS before macOS for an iPhone userAgent', () => {
    stubNavigator({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    expect(getDefaultPasskeyName()).toBe('Safari – iOS');
  });

  it('detects Firefox on Windows from the userAgent', () => {
    stubNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    });

    expect(getDefaultPasskeyName()).toBe('Firefox – Windows');
  });

  it('returns an empty string when nothing can be detected', () => {
    stubNavigator({ userAgent: 'some-headless-thing/1.0' });

    expect(getDefaultPasskeyName()).toBe('');
  });
});
