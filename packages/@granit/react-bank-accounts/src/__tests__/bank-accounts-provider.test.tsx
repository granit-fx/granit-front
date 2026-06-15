import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants';
import {
  BankAccountsProvider,
  buildBankAccountsQueryKey,
  useBankAccountsConfig,
} from '../providers/bank-accounts-provider';

import type { BankAccountsConfig } from '../providers/bank-accounts-provider';
import type { AxiosInstance } from 'axios';

const mockConfig: BankAccountsConfig = {
  client: {} as AxiosInstance,
  basePath: DEFAULT_BASE_PATH,
};

function createWrapper(config: BankAccountsConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <BankAccountsProvider config={config}>{children}</BankAccountsProvider>;
  };
}

describe('BankAccountsProvider', () => {
  it('should provide config via useBankAccountsConfig', () => {
    const { result } = renderHook(() => useBankAccountsConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('should default the basePath when omitted', () => {
    const { result } = renderHook(() => useBankAccountsConfig(), {
      wrapper: createWrapper({ client: {} as AxiosInstance }),
    });

    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useBankAccountsConfig());
    }).toThrow('useBankAccountsConfig must be used within a BankAccountsProvider');
  });

  it('should throw when no client is available', () => {
    expect(() => {
      renderHook(() => useBankAccountsConfig(), {
        wrapper: createWrapper({} as BankAccountsConfig),
      });
    }).toThrow('BankAccountsProvider requires an Axios client');
  });
});

describe('buildBankAccountsQueryKey', () => {
  it('should build key with default prefix', () => {
    const key = buildBankAccountsQueryKey(mockConfig, 'detail', 'acc-1');
    expect(key).toEqual(['bank-accounts', 'detail', 'acc-1']);
  });

  it('should build key with custom prefix', () => {
    const config: BankAccountsConfig = { ...mockConfig, queryKeyPrefix: ['custom'] };
    const key = buildBankAccountsQueryKey(config, 'by-party', 'party-1');
    expect(key).toEqual(['custom', 'by-party', 'party-1']);
  });
});
