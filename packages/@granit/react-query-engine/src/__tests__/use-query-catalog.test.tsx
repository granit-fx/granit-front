import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useQueryCatalog } from '../hooks/use-query-catalog';
import { useQueryMetaAt } from '../hooks/use-query-meta-at';
import { QueryCatalogProvider } from '../providers/query-catalog-provider';

import type { QueryCatalogConfig } from '../providers/query-catalog-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function createWrapper(config?: QueryCatalogConfig) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {config ? (
          <QueryCatalogProvider config={config}>{children}</QueryCatalogProvider>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useQueryCatalog', () => {
  it('fetches the catalogue from the provider root', async () => {
    const client = axios.create();
    const catalog = [
      {
        moduleName: 'Test',
        name: 'Granit.Test.Query',
        basePath: '/api/v1/patients',
        labelKey: 'Entity:Patient',
      },
    ];
    vi.spyOn(client, 'get').mockResolvedValue({ data: catalog });

    const { result } = renderHook(() => useQueryCatalog(), {
      wrapper: createWrapper({ client: client as AxiosInstance, basePath: '/api/v1' }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/catalog', undefined);
    expect(result.current.data).toEqual(catalog);
  });

  it('is disabled without a provider', () => {
    const { result } = renderHook(() => useQueryCatalog(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});

describe('useQueryMetaAt', () => {
  it('fetches metadata for the given base path', async () => {
    const client = axios.create();
    const meta = { columns: [], groupByFields: [{ name: 'status', type: 'String' }] };
    vi.spyOn(client, 'get').mockResolvedValue({ data: meta });

    const { result } = renderHook(() => useQueryMetaAt('/api/v1/patients'), {
      wrapper: createWrapper({ client: client as AxiosInstance, basePath: '/api/v1' }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/meta', undefined);
    expect(result.current.data).toEqual(meta);
  });

  it('is disabled when base path is null', () => {
    const client = axios.create();
    const spy = vi.spyOn(client, 'get');
    const { result } = renderHook(() => useQueryMetaAt(null), {
      wrapper: createWrapper({ client: client as AxiosInstance, basePath: '/api/v1' }),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(spy).not.toHaveBeenCalled();
  });
});
