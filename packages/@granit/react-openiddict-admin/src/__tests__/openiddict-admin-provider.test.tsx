import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  OpenIddictAdminProvider,
  buildAdminQueryKey,
  useAdminConfig,
} from '../providers/openiddict-admin-provider.js';

import type { OpenIddictAdminConfig } from '../providers/openiddict-admin-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: OpenIddictAdminConfig = {
  client: {} as AxiosInstance,
  basePath: '/api/custom',
};

function createWrapper(config: OpenIddictAdminConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <OpenIddictAdminProvider config={config}>{children}</OpenIddictAdminProvider>;
  };
}

describe('OpenIddictAdminProvider', () => {
  it('should provide config via useAdminConfig', () => {
    const { result } = renderHook(() => useAdminConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/custom');
  });

  it('should apply default basePath when not specified', () => {
    const config: OpenIddictAdminConfig = { client: {} as AxiosInstance };
    const { result } = renderHook(() => useAdminConfig(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.basePath).toBe('/admin');
  });

  it('should apply default queryKeyPrefix when not specified', () => {
    const config: OpenIddictAdminConfig = { client: {} as AxiosInstance };
    const { result } = renderHook(() => useAdminConfig(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.queryKeyPrefix).toEqual(['openiddict-admin']);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useAdminConfig());
    }).toThrow('useAdminConfig must be used within an OpenIddictAdminProvider');
  });
});

describe('buildAdminQueryKey', () => {
  it('should build key with default prefix', () => {
    const config: OpenIddictAdminConfig = { client: {} as AxiosInstance };
    const key = buildAdminQueryKey(config, 'users');
    expect(key).toEqual(['openiddict-admin', 'users']);
  });

  it('should build key with custom prefix', () => {
    const config: OpenIddictAdminConfig = {
      client: {} as AxiosInstance,
      queryKeyPrefix: ['custom'],
    };
    const key = buildAdminQueryKey(config, 'users', 'detail');
    expect(key).toEqual(['custom', 'users', 'detail']);
  });

  it('should build key with multiple segments', () => {
    const config: OpenIddictAdminConfig = { client: {} as AxiosInstance };
    const key = buildAdminQueryKey(config, 'oidc', 'applications');
    expect(key).toEqual(['openiddict-admin', 'oidc', 'applications']);
  });
});
