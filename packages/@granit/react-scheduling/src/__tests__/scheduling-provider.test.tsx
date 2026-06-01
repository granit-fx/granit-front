import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants';
import { SchedulingProvider, useSchedulingConfig } from '../providers/scheduling-provider';

import type { SchedulingConfig } from '../providers/scheduling-provider';
import type { AxiosInstance } from 'axios';

const mockConfig: SchedulingConfig = {
  client: {} as AxiosInstance,
  basePath: DEFAULT_BASE_PATH,
};

function createWrapper(config: SchedulingConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SchedulingProvider config={config}>{children}</SchedulingProvider>;
  };
}

describe('SchedulingProvider', () => {
  it('should provide config via useSchedulingConfig', () => {
    const { result } = renderHook(() => useSchedulingConfig(), {
      wrapper: createWrapper(mockConfig),
    });

    expect(result.current.client).toBe(mockConfig.client);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('should apply default basePath when not provided', () => {
    const config: SchedulingConfig = { client: {} as AxiosInstance };
    const { result } = renderHook(() => useSchedulingConfig(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useSchedulingConfig());
    }).toThrow('useSchedulingConfig must be used within a SchedulingProvider');
  });
});
