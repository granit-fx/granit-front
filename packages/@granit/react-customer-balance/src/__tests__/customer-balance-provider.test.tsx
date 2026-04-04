import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  CustomerBalanceProvider,
  buildCustomerBalanceQueryKey,
  useCustomerBalanceConfig,
} from '../providers/customer-balance-provider.js';

import type { CustomerBalanceConfig } from '../providers/customer-balance-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: CustomerBalanceConfig = {
  client: {} as AxiosInstance,
  basePath: '/api/granit/customer-balance',
};

function createWrapper(config: CustomerBalanceConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <CustomerBalanceProvider config={config}>{children}</CustomerBalanceProvider>;
  };
}

describe('CustomerBalanceProvider', () => {
  it('should provide config via useCustomerBalanceConfig', () => {
    const { result } = renderHook(() => useCustomerBalanceConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/granit/customer-balance');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useCustomerBalanceConfig());
    }).toThrow('useCustomerBalanceConfig must be used within a CustomerBalanceProvider');
  });
});

describe('buildCustomerBalanceQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildCustomerBalanceQueryKey(mockConfig, 'balance');
    expect(key).toEqual(['customer-balance', 'balance']);
  });

  it('should build key with custom prefix', () => {
    const config: CustomerBalanceConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildCustomerBalanceQueryKey(config, 'balance');
    expect(key).toEqual(['custom', 'balance']);
  });

  it('should support multiple segments', () => {
    const key = buildCustomerBalanceQueryKey(mockConfig, 'transactions', 'list');
    expect(key).toEqual(['customer-balance', 'transactions', 'list']);
  });
});
