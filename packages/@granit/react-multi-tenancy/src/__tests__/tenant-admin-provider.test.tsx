import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants.js';
import {
  TenantAdminProvider,
  buildTenantAdminQueryKey,
  useTenantAdminConfig,
} from '../providers/tenant-admin-provider.js';

import type { TenantAdminConfig } from '../providers/tenant-admin-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const mockClient = {} as AxiosInstance;

function createWrapper(config: TenantAdminConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <TenantAdminProvider config={config}>{children}</TenantAdminProvider>;
  };
}

describe('TenantAdminProvider', () => {
  it('should provide config with default basePath and queryKeyPrefix', () => {
    const { result } = renderHook(() => useTenantAdminConfig(), {
      wrapper: createWrapper({ client: mockClient }),
    });

    expect(result.current.client).toBe(mockClient);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
    expect(result.current.queryKeyPrefix).toEqual(['tenant-admin']);
  });

  it('should use custom basePath when provided', () => {
    const { result } = renderHook(() => useTenantAdminConfig(), {
      wrapper: createWrapper({ client: mockClient, basePath: '/custom/path' }),
    });

    expect(result.current.basePath).toBe('/custom/path');
  });

  it('should use custom queryKeyPrefix when provided', () => {
    const { result } = renderHook(() => useTenantAdminConfig(), {
      wrapper: createWrapper({
        client: mockClient,
        queryKeyPrefix: ['custom-prefix'],
      }),
    });

    expect(result.current.queryKeyPrefix).toEqual(['custom-prefix']);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useTenantAdminConfig());
    }).toThrow('useTenantAdminConfig must be used within a TenantAdminProvider');
  });
});

describe('buildTenantAdminQueryKey', () => {
  it('should build key with default prefix', () => {
    const config: TenantAdminConfig = { client: mockClient };
    const key = buildTenantAdminQueryKey(config, 'tenants');
    expect(key).toEqual(['tenant-admin', 'tenants']);
  });

  it('should build key with custom prefix', () => {
    const config: TenantAdminConfig = {
      client: mockClient,
      queryKeyPrefix: ['custom'],
    };
    const key = buildTenantAdminQueryKey(config, 'tenants');
    expect(key).toEqual(['custom', 'tenants']);
  });

  it('should support multiple segments', () => {
    const config: TenantAdminConfig = { client: mockClient };
    const key = buildTenantAdminQueryKey(config, 'tenants', 'active');
    expect(key).toEqual(['tenant-admin', 'tenants', 'active']);
  });
});
