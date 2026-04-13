import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  FeaturesProvider,
  buildFeaturesQueryKey,
  useFeaturesConfig,
} from '../providers/features-provider.js';

import type { FeaturesConfig } from '../providers/features-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: FeaturesConfig = {
  client: {} as AxiosInstance,
  basePath: '/api/v1/features',
};

function createWrapper(config: FeaturesConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <FeaturesProvider config={config}>{children}</FeaturesProvider>;
  };
}

describe('FeaturesProvider', () => {
  it('should provide config via useFeaturesConfig', () => {
    const { result } = renderHook(() => useFeaturesConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/v1/features');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useFeaturesConfig());
    }).toThrow('useFeaturesConfig must be used within a FeaturesProvider');
  });
});

describe('buildFeaturesQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildFeaturesQueryKey(mockConfig, 'definitions');
    expect(key).toEqual(['features', 'definitions']);
  });

  it('should build key with custom prefix', () => {
    const config: FeaturesConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildFeaturesQueryKey(config, 'definitions');
    expect(key).toEqual(['custom', 'definitions']);
  });

  it('should support multiple segments', () => {
    const key = buildFeaturesQueryKey(mockConfig, 'values', 'ui.dark-mode');
    expect(key).toEqual(['features', 'values', 'ui.dark-mode']);
  });
});
