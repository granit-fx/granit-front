import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  IdentityProvider,
  buildIdentityQueryKey,
  useIdentityConfig,
} from '../providers/identity-provider';

import type { IdentityConfig } from '../providers/identity-provider';
import type { AxiosInstance } from 'axios';

const mockConfig: IdentityConfig = {
  client: {} as AxiosInstance,
  basePath: '/api/v1/identity/users',
  providerBasePath: '/api/v1/identity/provider',
};

function createWrapper(config: IdentityConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <IdentityProvider config={config}>{children}</IdentityProvider>;
  };
}

describe('IdentityProvider', () => {
  it('should provide config via useIdentityConfig', () => {
    const { result } = renderHook(() => useIdentityConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/v1/identity/users');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useIdentityConfig());
    }).toThrow('useIdentityConfig must be used within an IdentityProvider');
  });
});

describe('buildIdentityQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildIdentityQueryKey(mockConfig, 'capabilities');
    expect(key).toEqual(['identity', 'capabilities']);
  });

  it('should build key with custom prefix', () => {
    const config: IdentityConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildIdentityQueryKey(config, 'capabilities');
    expect(key).toEqual(['custom', 'capabilities']);
  });
});
