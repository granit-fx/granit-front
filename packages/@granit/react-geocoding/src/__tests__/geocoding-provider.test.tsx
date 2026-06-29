import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants';
import {
  GeocodingProvider,
  buildGeocodingQueryKey,
  useGeocodingConfig,
  useOptionalGeocodingConfig,
} from '../providers/geocoding-provider';

import type { GeocodingConfig } from '../providers/geocoding-provider';
import type { AxiosInstance } from '@granit/api-client';

const mockConfig: GeocodingConfig = {
  client: {} as AxiosInstance,
  basePath: DEFAULT_BASE_PATH,
};

function createWrapper(config: GeocodingConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <GeocodingProvider config={config}>{children}</GeocodingProvider>;
  };
}

describe('GeocodingProvider', () => {
  it('provides config via useGeocodingConfig', () => {
    const { result } = renderHook(() => useGeocodingConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('defaults the basePath when omitted', () => {
    const { result } = renderHook(() => useGeocodingConfig(), {
      wrapper: createWrapper({ client: {} as AxiosInstance }),
    });

    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('returns null from useOptionalGeocodingConfig outside a provider', () => {
    const { result } = renderHook(() => useOptionalGeocodingConfig());
    expect(result.current).toBeNull();
  });
});

describe('buildGeocodingQueryKey', () => {
  it('uses the default prefix', () => {
    expect(buildGeocodingQueryKey({}, 'autocomplete', 'rue')).toEqual([
      'geocoding',
      'autocomplete',
      'rue',
    ]);
  });

  it('honours a custom prefix', () => {
    expect(buildGeocodingQueryKey({ queryKeyPrefix: ['x', 'geo'] }, 'reverse')).toEqual([
      'x',
      'geo',
      'reverse',
    ]);
  });
});
