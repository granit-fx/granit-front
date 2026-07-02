import { GranitClientProvider } from '@granit/react-api-client';
import { createQueryWrapper } from '@granit/react-testing';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useMetricCatalog } from '../hooks/use-metric-catalog';
import { mockMetricCatalog } from '../testing/data';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function mockClient() {
  const client = axios.create();
  const get = vi.spyOn(client, 'get').mockResolvedValue({ data: mockMetricCatalog });
  return { client: client as AxiosInstance, get };
}

function wrapper(client?: AxiosInstance) {
  const QueryWrapper = createQueryWrapper();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryWrapper>
        {client ? (
          <GranitClientProvider client={client}>{children}</GranitClientProvider>
        ) : (
          children
        )}
      </QueryWrapper>
    );
  };
}

describe('useMetricCatalog', () => {
  it('fetches GET /metrics/catalog and returns the entries', async () => {
    const { client, get } = mockClient();
    const { result } = renderHook(() => useMetricCatalog(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMetricCatalog);
    expect(get).toHaveBeenCalledWith('/api/v1/analytics/metrics/catalog', expect.anything());
  });

  it('stays disabled with no data when no GranitClient is in context', () => {
    const { result } = renderHook(() => useMetricCatalog(), { wrapper: wrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
