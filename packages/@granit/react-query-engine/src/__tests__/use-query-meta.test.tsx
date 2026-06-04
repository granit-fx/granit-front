import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useQueryMeta } from '../hooks/use-query-meta';
import { QueryProvider } from '../providers/query-provider';

import type { QueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(config: QueryConfig) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <QueryProvider config={config}>{children}</QueryProvider>
      </QueryClientProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useQueryMeta
// ---------------------------------------------------------------------------

describe('useQueryMeta', () => {
  it('should fetch query metadata', async () => {
    const client = axios.create();
    const meta = {
      sortableFields: ['name', 'createdAt'],
      filterableFields: ['status', 'type'],
    };
    vi.spyOn(client, 'get').mockResolvedValue({ data: meta });

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useQueryMeta(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/meta', undefined);
    expect(result.current.data).toEqual(meta);
  });

  it('should cache metadata with staleTime Infinity', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: { sortableFields: [] } });

    const config: QueryConfig = { client, basePath: '/api/v1/orders' };
    const wrapper = createWrapper(config);

    const { result, rerender } = renderHook(() => useQueryMeta(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender();

    expect(client.get).toHaveBeenCalledTimes(1);
  });
});
