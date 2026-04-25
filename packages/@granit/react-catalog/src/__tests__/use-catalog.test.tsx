import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useArchiveProduct,
  useCreateProduct,
  useProduct,
  useProductBySku,
  usePublishProduct,
  usePublishedProducts,
  useUpdateProduct,
  useUpdateProductMetadata,
} from '../hooks/use-catalog.js';
import { CatalogProvider } from '../providers/catalog-provider.js';

import type { CatalogConfig } from '../providers/catalog-provider.js';
import type {
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '@granit/catalog';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleProduct: ProductResponse = {
  id: toEntityId<'Product'>('prd_001'),
  sku: 'API-CALLS',
  name: 'API Calls',
  description: 'Per-call billing for the public API.',
  type: 'Metered',
  unit: 'call',
  lifecycleStatus: 'Published',
  metadata: { tier: 'standard' },
  externalMappings: [],
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: CatalogConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <CatalogProvider config={config}>{children}</CatalogProvider>
    );
  };
}

describe('use-catalog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePublishedProducts', () => {
    it('fetches published products', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

      const { result } = renderHook(() => usePublishedProducts(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/catalog/products');
      expect(result.current.data).toEqual([sampleProduct]);
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

      const { result } = renderHook(() => usePublishedProducts(), {
        wrapper: createWrapper(client, '/custom/catalog'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/catalog/products');
    });
  });

  describe('useProduct', () => {
    it('fetches a single product by id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => useProduct('prd_001'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/catalog/products/prd_001');
    });

    it('is disabled with empty id', () => {
      const client = createMockClient();
      const { result } = renderHook(() => useProduct(''), {
        wrapper: createWrapper(client),
      });
      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useProductBySku', () => {
    it('fetches a product by sku', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => useProductBySku('API-CALLS'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/catalog/products/by-sku/API-CALLS');
    });
  });

  describe('useCreateProduct', () => {
    it('creates a product and invalidates the products list', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(client),
      });

      const request: ProductCreateRequest = {
        sku: 'API-CALLS',
        name: 'API Calls',
        type: 'Metered',
        unit: 'call',
      };

      await result.current.mutateAsync(request);
      expect(client.post).toHaveBeenCalledWith('/api/v1/catalog/products', request);
    });
  });

  describe('useUpdateProduct', () => {
    it('updates a draft product', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(client),
      });

      const request: ProductUpdateRequest = {
        name: 'API Calls v2',
        description: null,
        unit: 'call',
      };

      await result.current.mutateAsync({ id: 'prd_001', request });
      expect(client.put).toHaveBeenCalledWith('/api/v1/catalog/products/prd_001', request);
    });
  });

  describe('useUpdateProductMetadata', () => {
    it('replaces product metadata', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => useUpdateProductMetadata(), {
        wrapper: createWrapper(client),
      });

      const request: UpdateProductMetadataRequest = {
        metadata: { region: 'eu' },
      };

      await result.current.mutateAsync({ id: 'prd_001', request });
      expect(client.put).toHaveBeenCalledWith('/api/v1/catalog/products/prd_001/metadata', request);
    });
  });

  describe('usePublishProduct', () => {
    it('publishes a draft product', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => usePublishProduct(), {
        wrapper: createWrapper(client),
      });

      await result.current.mutateAsync('prd_001');
      expect(client.post).toHaveBeenCalledWith('/api/v1/catalog/products/prd_001/publish');
    });
  });

  describe('useArchiveProduct', () => {
    it('archives a published product', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

      const { result } = renderHook(() => useArchiveProduct(), {
        wrapper: createWrapper(client),
      });

      await result.current.mutateAsync('prd_001');
      expect(client.post).toHaveBeenCalledWith('/api/v1/catalog/products/prd_001/archive');
    });
  });
});
