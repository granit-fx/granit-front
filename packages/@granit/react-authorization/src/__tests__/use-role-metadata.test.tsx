import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRoleMetadata, useRoleMetadataMeta } from '../hooks/use-role-metadata';

import { createAuthorizationWrapper } from './test-wrapper';

import type { RoleMetadata } from '@granit/authorization';
import type { QueryMetadata, PagedResult } from '@granit/query-engine';

const MOCK_PAGE: PagedResult<RoleMetadata> = {
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

describe('useRoleMetadata', () => {
  it('GETs /authorization/role-metadata with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_PAGE });

    const { result } = renderHook(() => useRoleMetadata(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/authorization/role-metadata'),
      expect.anything()
    );
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_PAGE });

    const { result } = renderHook(() => useRoleMetadata({ basePath: '/api/v2/authorization' }), {
      wrapper: createAuthorizationWrapper(client, { basePath: '/api/v2/authorization' }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/authorization/role-metadata'),
      expect.anything()
    );
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useRoleMetadata({ enabled: false }), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useRoleMetadataMeta', () => {
  it('GETs /authorization/role-metadata/meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: MOCK_META });

    const { result } = renderHook(() => useRoleMetadataMeta(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/authorization/role-metadata/meta'),
      expect.anything()
    );
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useRoleMetadataMeta({ enabled: false }), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
