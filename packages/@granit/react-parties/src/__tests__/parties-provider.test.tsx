import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants';
import {
  PartiesProvider,
  buildPartiesQueryKey,
  usePartiesConfig,
} from '../providers/parties-provider';

import type { PartiesConfig } from '../providers/parties-provider';
import type { AxiosInstance } from 'axios';

const mockConfig: PartiesConfig = {
  client: {} as AxiosInstance,
  basePath: DEFAULT_BASE_PATH,
};

function createWrapper(config: PartiesConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <PartiesProvider config={config}>{children}</PartiesProvider>;
  };
}

describe('PartiesProvider', () => {
  it('provides config via usePartiesConfig', () => {
    const { result } = renderHook(() => usePartiesConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('falls back to DEFAULT_BASE_PATH when not provided', () => {
    const { result } = renderHook(() => usePartiesConfig(), {
      wrapper: createWrapper({ client: {} as AxiosInstance }),
    });

    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => usePartiesConfig())).toThrow(
      'usePartiesConfig must be used within a <PartiesProvider>'
    );
  });
});

describe('buildPartiesQueryKey', () => {
  it('builds key with default prefix', () => {
    const key = buildPartiesQueryKey(mockConfig, 'list', 'all');
    expect(key).toEqual(['parties', 'list', 'all']);
  });

  it('builds key with custom prefix', () => {
    const config: PartiesConfig = { ...mockConfig, queryKeyPrefix: ['custom', 'parties'] };
    const key = buildPartiesQueryKey(config, 'detail', 'id-1');
    expect(key).toEqual(['custom', 'parties', 'detail', 'id-1']);
  });
});
