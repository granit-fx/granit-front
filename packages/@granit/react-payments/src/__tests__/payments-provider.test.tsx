import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  PaymentsProvider,
  buildPaymentsQueryKey,
  usePaymentsConfig,
} from '../providers/payments-provider.js';

import type { PaymentsConfig } from '../providers/payments-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: PaymentsConfig = {
  client: {} as AxiosInstance,
  basePath: '/api/v1/payments',
};

function createWrapper(config: PaymentsConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <PaymentsProvider config={config}>{children}</PaymentsProvider>;
  };
}

describe('PaymentsProvider', () => {
  it('should provide config via usePaymentsConfig', () => {
    const { result } = renderHook(() => usePaymentsConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/v1/payments');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => usePaymentsConfig());
    }).toThrow('usePaymentsConfig must be used within a PaymentsProvider');
  });
});

describe('buildPaymentsQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildPaymentsQueryKey(mockConfig, 'transactions');
    expect(key).toEqual(['payments', 'transactions']);
  });

  it('should build key with custom prefix', () => {
    const config: PaymentsConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildPaymentsQueryKey(config, 'transactions');
    expect(key).toEqual(['custom', 'transactions']);
  });

  it('should support multiple segments', () => {
    const key = buildPaymentsQueryKey(mockConfig, 'methods', 'available');
    expect(key).toEqual(['payments', 'methods', 'available']);
  });
});
