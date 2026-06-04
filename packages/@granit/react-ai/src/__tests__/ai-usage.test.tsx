import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AIUsageProvider } from '../usage/ai-usage-provider';
import { useAIUsage } from '../usage/use-ai-usage';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AIUsageProvider client={client}>{children}</AIUsageProvider>
    );
  };
}

describe('useAIUsage', () => {
  it('exposes the query-engine endpoint within an AIUsageProvider', () => {
    const client = createMockClient();
    const paged = { data: { items: [], totalCount: 0, columns: [], groupByFields: [] } };
    vi.mocked(client.get).mockResolvedValue(paged);
    vi.mocked(client.post).mockResolvedValue(paged);

    const { result } = renderHook(() => useAIUsage(), { wrapper: createWrapper(client) });

    expect(result.current.params).toBeDefined();
    expect(typeof result.current.setPage).toBe('function');
    expect(typeof result.current.toggleSort).toBe('function');
  });

  it('throws when used outside an AIUsageProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useAIUsage())).toThrow();
    spy.mockRestore();
  });
});
