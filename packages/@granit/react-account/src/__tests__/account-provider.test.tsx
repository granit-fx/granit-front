import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  AccountProvider,
  buildAccountQueryKey,
  useAccountConfig,
} from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: AccountConfig = {
  client: {} as AxiosInstance,
  basePath: '/custom/account',
};

function createWrapper(config: AccountConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AccountProvider config={config}>{children}</AccountProvider>;
  };
}

describe('AccountProvider', () => {
  it('should provide config via useAccountConfig', () => {
    const { result } = renderHook(() => useAccountConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/custom/account');
  });

  it('should apply default basePath when not provided', () => {
    const config: AccountConfig = { client: {} as AxiosInstance };
    const { result } = renderHook(() => useAccountConfig(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.basePath).toBe('/api/v1/account');
  });

  it('should apply default queryKeyPrefix when not provided', () => {
    const config: AccountConfig = { client: {} as AxiosInstance };
    const { result } = renderHook(() => useAccountConfig(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.queryKeyPrefix).toEqual(['account']);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useAccountConfig());
    }).toThrow('useAccountConfig must be used within an AccountProvider');
  });
});

describe('buildAccountQueryKey', () => {
  it('should build key with default prefix', () => {
    const config: AccountConfig = { client: {} as AxiosInstance };
    const key = buildAccountQueryKey(config, 'profile');
    expect(key).toEqual(['account', 'profile']);
  });

  it('should build key with custom prefix', () => {
    const config: AccountConfig = { client: {} as AxiosInstance, queryKeyPrefix: ['custom'] };
    const key = buildAccountQueryKey(config, 'profile');
    expect(key).toEqual(['custom', 'profile']);
  });

  it('should support multiple segments', () => {
    const config: AccountConfig = { client: {} as AxiosInstance };
    const key = buildAccountQueryKey(config, 'two-factor', 'authenticator-key');
    expect(key).toEqual(['account', 'two-factor', 'authenticator-key']);
  });
});
