import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePermissionGrantMeta, usePermissionGrants } from '../hooks/use-permission-grants';

import { createAuthorizationWrapper } from './test-wrapper';

import type { PermissionGrant } from '@granit/authorization';
import type { QueryMetadata, PagedResult } from '@granit/query-engine';

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

    const { result } = renderHook(() => usePermissionGrants(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/authorization/grants'),
      expect.anything()
    );
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_PAGE });

    const { result } = renderHook(
      () => usePermissionGrants({ basePath: '/api/v2/authorization' }),
      { wrapper: createAuthorizationWrapper(client, { basePath: '/api/v2/authorization' }) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/authorization/grants'),
      expect.anything()
    );
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => usePermissionGrants({ enabled: false }), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('usePermissionGrantMeta', () => {
  it('GETs /authorization/grants/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_META });

    const { result } = renderHook(() => usePermissionGrantMeta(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/authorization/grants/meta'),
      expect.anything()
    );
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => usePermissionGrantMeta({ enabled: false }), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
