import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApiKeyQueryKey } from '../hooks/query-keys';
import { useApiKey } from '../hooks/use-api-key';
import { useApiKeys, useApiKeysQueryMeta } from '../hooks/use-api-keys';

import type {
  ApiKeyListItemResponse,
  ApiKeyListPage,
  ApiKeyResponse,
} from '@granit/authentication-api-keys';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockApiKey: ApiKeyResponse = {
  id: 'key-1',
  name: 'Test Key',
  type: 'Secret',
  environment: 'production',
  prefix: 'test',
  lastFourChars: 'xYzW',
  permissions: ['Invoices.Read'],
  allowedCidrs: ['10.0.0.0/8'],
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  cacheBehavior: 'Normal',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
};

const mockListItem: ApiKeyListItemResponse = {
  id: 'key-1',
  name: 'Test Key',
  type: 'Secret',
  environment: 'production',
  prefix: 'test',
  lastFourChars: 'xYzW',
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  cacheBehavior: 'Normal',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
};

const emptyPage: ApiKeyListPage = {
  items: [],
  totalCount: 0,
  hasMore: false,
  nextCursor: null,
};

/** Decode the URL string the QueryEngine layer forwarded to `client.get`. */
function calledUrl(client: ReturnType<typeof createMockClient>, callIndex = 0): string {
  return decodeURIComponent(vi.mocked(client.get).mock.calls[callIndex]![0] as string);
}

// ---------------------------------------------------------------------------
// buildApiKeyQueryKey
// ---------------------------------------------------------------------------

describe('buildApiKeyQueryKey', () => {
  it('should use default prefix when no queryKeyPrefix is provided', () => {
    expect(buildApiKeyQueryKey({}, 'list')).toEqual(['api-keys', 'list']);
  });

  it('should use custom prefix when queryKeyPrefix is provided', () => {
    const config = { queryKeyPrefix: ['custom', 'keys'] as const };
    expect(buildApiKeyQueryKey(config, 'list')).toEqual(['custom', 'keys', 'list']);
  });

  it('should return only the prefix when no segments are provided', () => {
    expect(buildApiKeyQueryKey({})).toEqual(['api-keys']);
  });

  it('should handle complex segments', () => {
    const params = { search: 'test' };
    expect(buildApiKeyQueryKey({}, 'list', params)).toEqual(['api-keys', 'list', params]);
  });
});

// ---------------------------------------------------------------------------
// useApiKeys
// ---------------------------------------------------------------------------

describe('useApiKeys', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch the paginated API key list with default base path', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [mockListItem], totalCount: 1, hasMore: false, nextCursor: null },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKeys({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(calledUrl(client)).toBe('/api/v1/authentication/api-keys');
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].id).toBe('key-1');
    expect(result.current.data?.totalCount).toBe(1);
  });

  it('should forward the abort signal to the request', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(() => useApiKeys({ client }), { wrapper });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/authentication/api-keys',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('should serialize the search term into the query string', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(() => useApiKeys({ client }, { search: 'prod' }), { wrapper });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(calledUrl(client)).toContain('search=prod');
  });

  it('should map a type filter to filter[type.Eq]', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useApiKeys({ client }, { filters: [{ field: 'type', operator: 'Eq', value: 'Secret' }] }),
      { wrapper }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(calledUrl(client)).toContain('filter[type.Eq]=Secret');
  });

  it('should map an environment filter to filter[environment.Eq]', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useApiKeys(
          { client },
          { filters: [{ field: 'environment', operator: 'Eq', value: 'staging' }] }
        ),
      { wrapper }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(calledUrl(client)).toContain('filter[environment.Eq]=staging');
  });

  it('should map the "show revoked" toggle to quickFilters=includeRevoked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(() => useApiKeys({ client }, { quickFilters: ['includeRevoked'] }), { wrapper });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(calledUrl(client)).toContain('quickFilters=includeRevoked');
  });

  it('should serialize pagination params into the query string', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(() => useApiKeys({ client }, { page: 2, pageSize: 25 }), { wrapper });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    const url = calledUrl(client);
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=25');
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    renderHook(() => useApiKeys({ client, basePath: '/api/v2/authentication' }), { wrapper });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(calledUrl(client)).toBe('/api/v2/authentication/api-keys');
  });

  it('should surface errors from the API', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Unauthorized'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKeys({ client }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Unauthorized');
  });

  it('should return an empty page when the list is empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: emptyPage });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKeys({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toEqual([]);
    expect(result.current.data?.totalCount).toBe(0);
  });

  it('accepts TanStack query option overrides (staleTime)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [mockListItem], totalCount: 1, hasMore: false, nextCursor: null },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKeys({ client }, {}, { staleTime: 60_000 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// useApiKeysQueryMeta
// ---------------------------------------------------------------------------

describe('useApiKeysQueryMeta', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should GET the api-keys /meta sub-path', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { columns: [], filterableFields: [], quickFilters: [] },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKeysQueryMeta({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/authentication/api-keys/meta',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});

// ---------------------------------------------------------------------------
// useApiKey
// ---------------------------------------------------------------------------

describe('useApiKey', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch a single API key by ID', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockApiKey });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKey('key-1', { client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/authentication/api-keys/key-1');
    expect(result.current.data?.id).toBe('key-1');
    expect(result.current.data?.name).toBe('Test Key');
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockApiKey });

    const { wrapper } = createWrapper();
    renderHook(() => useApiKey('key-1', { client, basePath: '/api/v2/authentication' }), {
      wrapper,
    });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(client.get).toHaveBeenCalledWith('/api/v2/authentication/api-keys/key-1');
  });

  it('should not fetch when id is empty', async () => {
    const client = createMockClient();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKey('', { client }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
  });

  it('should surface errors from the API', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Not found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApiKey('key-999', { client }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not found');
  });
});
