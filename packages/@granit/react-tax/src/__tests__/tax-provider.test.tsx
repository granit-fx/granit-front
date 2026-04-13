import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants.js';
import { TaxProvider, buildTaxQueryKey, useTaxConfig } from '../providers/tax-provider.js';

import type { TaxConfig } from '../providers/tax-provider.js';
import type { AxiosInstance } from 'axios';

const mockConfig: TaxConfig = {
  client: {} as AxiosInstance,
  basePath: DEFAULT_BASE_PATH,
};

function createWrapper(config: TaxConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TaxProvider config={config}>{children}</TaxProvider>;
  };
}

describe('TaxProvider', () => {
  it('should provide config via useTaxConfig', () => {
    const { result } = renderHook(() => useTaxConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useTaxConfig());
    }).toThrow('useTaxConfig must be used within a TaxProvider');
  });
});

describe('buildTaxQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildTaxQueryKey(mockConfig, 'rates');
    expect(key).toEqual(['tax', 'rates']);
  });

  it('should build key with custom prefix', () => {
    const config: TaxConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildTaxQueryKey(config, 'rates');
    expect(key).toEqual(['custom', 'rates']);
  });

  it('should support multiple segments', () => {
    const key = buildTaxQueryKey(mockConfig, 'rates', 'BE');
    expect(key).toEqual(['tax', 'rates', 'BE']);
  });
});
