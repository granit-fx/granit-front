import { describe, expect, it } from 'vitest';

import { composeDeviceLabel } from '../device-label';

import type { DeviceLabelStrings } from '../device-label';

const labels: DeviceLabelStrings = {
  on: 'on',
  kind: {
    Unknown: 'Unknown device',
    Browser: 'Browser',
    BrowserExtension: 'Browser extension',
    MobileApp: 'Mobile app',
    DesktopApp: 'Desktop app',
    Wearable: 'Wearable',
    Tv: 'TV',
    Embedded: 'Embedded device',
    ApiClient: 'API client',
  },
};

describe('composeDeviceLabel', () => {
  it('leads with the browser family for browser kinds', () => {
    expect(
      composeDeviceLabel({ kind: 'Browser', browser: 'Firefox', operatingSystem: 'Linux' }, labels)
    ).toBe('Firefox on Linux');
  });

  it('leads with the localized kind name for non-browser kinds', () => {
    expect(
      composeDeviceLabel({ kind: 'MobileApp', browser: null, operatingSystem: 'iOS' }, labels)
    ).toBe('Mobile app on iOS');
  });

  it('falls back to the kind label when the browser is unknown', () => {
    expect(
      composeDeviceLabel({ kind: 'Browser', browser: null, operatingSystem: 'Windows' }, labels)
    ).toBe('Browser on Windows');
  });

  it('omits the OS when not known', () => {
    expect(
      composeDeviceLabel({ kind: 'ApiClient', browser: null, operatingSystem: null }, labels)
    ).toBe('API client');
  });

  it('labels an unclassified device', () => {
    expect(
      composeDeviceLabel({ kind: 'Unknown', browser: null, operatingSystem: null }, labels)
    ).toBe('Unknown device');
  });
});
