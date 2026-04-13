import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants.js';
import {
  BackgroundJobsProvider,
  buildBackgroundJobsQueryKey,
  useBackgroundJobsConfig,
} from '../providers/background-jobs-provider.js';

import type { BackgroundJobsConfig } from '../providers/background-jobs-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const mockClient = {} as AxiosInstance;

function createWrapper(config: BackgroundJobsConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <BackgroundJobsProvider config={config}>{children}</BackgroundJobsProvider>;
  };
}

describe('BackgroundJobsProvider', () => {
  it('should provide config with default basePath', () => {
    const { result } = renderHook(() => useBackgroundJobsConfig(), {
      wrapper: createWrapper({ client: mockClient }),
    });

    expect(result.current.client).toBe(mockClient);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('should use custom basePath when provided', () => {
    const { result } = renderHook(() => useBackgroundJobsConfig(), {
      wrapper: createWrapper({ client: mockClient, basePath: '/custom/path' }),
    });

    expect(result.current.basePath).toBe('/custom/path');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useBackgroundJobsConfig());
    }).toThrow('useBackgroundJobsConfig must be used within a BackgroundJobsProvider');
  });
});

describe('buildBackgroundJobsQueryKey', () => {
  it('should build key with default prefix', () => {
    const config: BackgroundJobsConfig = { client: mockClient };
    const key = buildBackgroundJobsQueryKey(config, 'jobs');
    expect(key).toEqual(['background-jobs', 'jobs']);
  });

  it('should build key with custom prefix', () => {
    const config: BackgroundJobsConfig = {
      client: mockClient,
      queryKeyPrefix: ['custom'],
    };
    const key = buildBackgroundJobsQueryKey(config, 'jobs');
    expect(key).toEqual(['custom', 'jobs']);
  });

  it('should support multiple segments', () => {
    const config: BackgroundJobsConfig = { client: mockClient };
    const key = buildBackgroundJobsQueryKey(config, 'jobs', 'active');
    expect(key).toEqual(['background-jobs', 'jobs', 'active']);
  });
});
