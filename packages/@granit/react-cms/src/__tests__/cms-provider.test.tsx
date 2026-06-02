import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { CmsProvider, useCmsConfig } from '../providers/cms-provider';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const mockClient = {} as AxiosInstance;

function createWrapper(config: { client?: AxiosInstance; basePath?: string } = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <CmsProvider config={{ client: mockClient, ...config }}>{children}</CmsProvider>
    );
  };
}

describe('CmsProvider / useCmsConfig', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useCmsConfig())).toThrow(
      'useCmsConfig must be used within a CmsProvider'
    );
  });

  it('returns resolved config with injected client and default basePath', () => {
    const { result } = renderHook(() => useCmsConfig(), { wrapper: createWrapper() });
    expect(result.current.client).toBe(mockClient);
    expect(result.current.basePath).toBe('');
    expect(result.current.queryKeyPrefix).toEqual(['cms']);
  });

  it('uses custom basePath when provided', () => {
    const { result } = renderHook(() => useCmsConfig(), {
      wrapper: createWrapper({ basePath: 'https://api.example.com' }),
    });
    expect(result.current.basePath).toBe('https://api.example.com');
  });
});
