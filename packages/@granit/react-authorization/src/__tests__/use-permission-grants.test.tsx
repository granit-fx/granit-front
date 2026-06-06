import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { usePermissionGrantMeta, usePermissionGrants } from '../hooks/use-permission-grants';

import type { PermissionGrant } from '@granit/authorization';
import type { QueryMetadata, PagedResult } from '@granit/query-engine';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const MOCK_PAGE: PagedResult<PermissionGrant> = {
  items: [],
  totalCount: 0,
  hasMore: false,
};

const MOCK_META: QueryMetadata = {
  columns: [],
  filterableFields: [],
  sortableFields: [],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: { defaultPageSize: 20, maxPageSize: 100, supportsCursor: false },
  defaultSort: null,
};

describe('usePermissionGrants', () => {
  it('GETs /authorization/grants with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_PAGE });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePermissionGrants({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/authorization/grants'),
      expect.anything()
    );
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_PAGE });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePermissionGrants({ client, basePath: '/api/v2/authorization' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/authorization/grants'),
      expect.anything()
    );
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePermissionGrants({ client, enabled: false }), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('usePermissionGrantMeta', () => {
  it('GETs /authorization/grants/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_META });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePermissionGrantMeta({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/authorization/grants/meta'),
      expect.anything()
    );
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePermissionGrantMeta({ client, enabled: false }), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
