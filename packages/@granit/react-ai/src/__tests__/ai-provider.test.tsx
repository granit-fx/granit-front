import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AIProvider, useAIConfig } from '../providers/ai-provider';

import type { AIConfig } from '../providers/ai-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const fakeClient = {} as AxiosInstance;

function createWrapper(config: AIConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AIProvider config={config}>{children}</AIProvider>;
  };
}

describe('AIProvider', () => {
  it('should provide config to children', () => {
    const config: AIConfig = { client: fakeClient, basePath: '/api' };

    const { result } = renderHook(() => useAIConfig(), {
      wrapper: createWrapper(config),
    });

    expect(result.current.client).toBe(fakeClient);
    expect(result.current.basePath).toBe('/api');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useAIConfig());
    }).toThrow('useAIConfig must be used within an AIProvider');
  });
});
