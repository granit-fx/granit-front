import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import {
  InvoicingProvider,
  buildInvoicingQueryKey,
  useInvoicingConfig,
} from '../providers/invoicing-provider.js';

import type { InvoicingConfig } from '../providers/invoicing-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: InvoicingConfig = {
  client: {} as AxiosInstance,
  basePath: '/api/granit/invoicing',
};

function createWrapper(config: InvoicingConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <InvoicingProvider config={config}>{children}</InvoicingProvider>;
  };
}

describe('InvoicingProvider', () => {
  it('should provide config via useInvoicingConfig', () => {
    const { result } = renderHook(() => useInvoicingConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe('/api/granit/invoicing');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useInvoicingConfig());
    }).toThrow('useInvoicingConfig must be used within an InvoicingProvider');
  });
});

describe('buildInvoicingQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildInvoicingQueryKey(mockConfig, 'invoices');
    expect(key).toEqual(['invoicing', 'invoices']);
  });

  it('should build key with custom prefix', () => {
    const config: InvoicingConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildInvoicingQueryKey(config, 'invoices');
    expect(key).toEqual(['custom', 'invoices']);
  });

  it('should support multiple segments', () => {
    const key = buildInvoicingQueryKey(mockConfig, 'invoices', 'inv-1');
    expect(key).toEqual(['invoicing', 'invoices', 'inv-1']);
  });
});
