import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_BASE_PATH } from '../constants';
import {
  CatalogProvider,
  buildCatalogQueryKey,
  useCatalogConfig,
} from '../providers/catalog-provider';
import {
  useCreateProduct,
  useProduct,
  useProductBySku,
  usePublishedProducts,
} from '../hooks/use-products';

import type { CatalogConfig } from '../providers/catalog-provider';
import type {
  ProductCreateRequest,
  ProductExternalMappingId,
  ProductExternalMappingResponse,
  ProductId,
  ProductResponse,
} from '@granit/catalog';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRODUCT_ID = toEntityId<'Product'>('prod-001') as ProductId;
const MAPPING_ID = toEntityId<'ProductExternalMapping'>('map-001') as ProductExternalMappingId;

const sampleMapping: ProductExternalMappingResponse = {
  id: MAPPING_ID,
  providerName: 'Stripe',
  externalId: 'price_abc123',
};

const sampleProduct: ProductResponse = {
  id: PRODUCT_ID,
  sku: 'SKU-001',
  name: 'Widget Pro',
  description: 'A professional widget',
  type: 'Good',
  unit: 'each',
  lifecycleStatus: 'Published',
  metadata: { category: 'hardware' },
  externalMappings: [sampleMapping],
};

const sampleDraftProduct: ProductResponse = {
  id: toEntityId<'Product'>('prod-002') as ProductId,
  sku: 'SKU-002',
  name: 'Widget Lite',
  description: null,
  type: 'Good',
  unit: 'each',
  lifecycleStatus: 'Draft',
  metadata: {},
  externalMappings: [],
};

const createRequest: ProductCreateRequest = {
  sku: 'SKU-NEW',
  name: 'New Widget',
  type: 'Service',
  unit: 'hour',
  description: 'A newly created service',
};

// ---------------------------------------------------------------------------
// Wrapper helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: CatalogConfig = { client, basePath: basePath ?? DEFAULT_BASE_PATH };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <CatalogProvider config={config}>{children}</CatalogProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// CatalogProvider
// ---------------------------------------------------------------------------

describe('CatalogProvider', () => {
  it('throws when no client is provided and no GranitClientProvider is present', () => {
    // CatalogConfig without a client — useMemo in the provider throws.
    function BareWrapper({ children }: { children: ReactNode }) {
      // Pass an explicit undefined client; basePath must be present.
      const config = { basePath: DEFAULT_BASE_PATH } as unknown as CatalogConfig;
      return <CatalogProvider config={config}>{children}</CatalogProvider>;
    }

    expect(() => {
      renderHook(() => useCatalogConfig(), { wrapper: BareWrapper });
    }).toThrow(
      'CatalogProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
    );
  });

  it('provides resolved config (client + basePath) via useCatalogConfig', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useCatalogConfig(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe(DEFAULT_BASE_PATH);
  });

  it('applies a custom basePath when supplied', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useCatalogConfig(), {
      wrapper: createWrapper(client, '/custom/catalog'),
    });

    expect(result.current.basePath).toBe('/custom/catalog');
  });

  it('throws when useCatalogConfig is called outside a CatalogProvider', () => {
    expect(() => {
      renderHook(() => useCatalogConfig());
    }).toThrow('useCatalogConfig must be used within a CatalogProvider');
  });
});

// ---------------------------------------------------------------------------
// buildCatalogQueryKey
// ---------------------------------------------------------------------------

describe('buildCatalogQueryKey', () => {
  const baseConfig: CatalogConfig = {
    client: {} as AxiosInstance,
    basePath: DEFAULT_BASE_PATH,
  };

  it('builds a key with the default prefix', () => {
    const key = buildCatalogQueryKey(baseConfig, 'products', 'published');
    expect(key).toEqual(['catalog', 'products', 'published']);
  });

  it('builds a key with a custom prefix', () => {
    const config: CatalogConfig = { ...baseConfig, queryKeyPrefix: ['my-app', 'catalog'] };
    const key = buildCatalogQueryKey(config, 'products');
    expect(key).toEqual(['my-app', 'catalog', 'products']);
  });

  it('builds a key with a single segment', () => {
    const key = buildCatalogQueryKey(baseConfig, 'products');
    expect(key).toEqual(['catalog', 'products']);
  });

  it('builds a key with no extra segments', () => {
    const key = buildCatalogQueryKey(baseConfig);
    expect(key).toEqual(['catalog']);
  });
});

// ---------------------------------------------------------------------------
// usePublishedProducts
// ---------------------------------------------------------------------------

describe('usePublishedProducts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches all published products', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

    const { result } = renderHook(() => usePublishedProducts(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(`${DEFAULT_BASE_PATH}/products`);
    expect(result.current.data).toEqual([sampleProduct]);
  });

  it('returns an empty array when there are no products', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => usePublishedProducts(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('uses a custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

    const { result } = renderHook(() => usePublishedProducts(), {
      wrapper: createWrapper(client, '/custom/catalog'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/catalog/products');
  });
});

// ---------------------------------------------------------------------------
// useProduct
// ---------------------------------------------------------------------------

describe('useProduct', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a product by id when id is provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

    const { result } = renderHook(() => useProduct(PRODUCT_ID), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      `${DEFAULT_BASE_PATH}/products/${encodeURIComponent(PRODUCT_ID)}`
    );
    expect(result.current.data).toEqual(sampleProduct);
  });

  it('is disabled (does not fetch) when id is null', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useProduct(null), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('is disabled (does not fetch) when id is undefined', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useProduct(undefined), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useProductBySku
// ---------------------------------------------------------------------------

describe('useProductBySku', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a product by SKU when sku is provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDraftProduct });

    const { result } = renderHook(() => useProductBySku('SKU-002'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      `${DEFAULT_BASE_PATH}/products/by-sku/${encodeURIComponent('SKU-002')}`
    );
    expect(result.current.data).toEqual(sampleDraftProduct);
  });

  it('is disabled (does not fetch) when sku is null', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useProductBySku(null), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('is disabled (does not fetch) when sku is empty string', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useProductBySku(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('is disabled (does not fetch) when sku is undefined', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useProductBySku(undefined), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useCreateProduct
// ---------------------------------------------------------------------------

describe('useCreateProduct', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST with the create request and returns the created product', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleDraftProduct });

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate(createRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith(`${DEFAULT_BASE_PATH}/products`, createRequest);
    expect(result.current.data).toEqual(sampleDraftProduct);
  });

  it('uses a custom basePath for POST', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleDraftProduct });

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(client, '/custom/catalog'),
    });

    result.current.mutate(createRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.post).toHaveBeenCalledWith('/custom/catalog/products', createRequest);
  });
});
