import { getRelease, listReleases } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockReleases } from '@granit/react-cms/testing';

import { useRelease, useReleases } from '../hooks/use-releases';
import { CmsProvider } from '../providers/cms-provider';

import type { ReleaseResponse } from '@granit/cms';
import type { PagedResult } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  listReleases: vi.fn(),
  getRelease: vi.fn(),
}));

const release = mockReleases[0]!;

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CmsProvider, { config: { client }, children })
    );
  };
}

describe('useReleases', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paged releases', async () => {
    const client = createMockClient();
    const paged: PagedResult<ReleaseResponse> = {
      items: [release],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(listReleases).mockResolvedValue(paged);

    const { result } = renderHook(() => useReleases({ page: 1, pageSize: 20 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listReleases).toHaveBeenCalledWith(
      client,
      '/api/cms',
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});

describe('useRelease', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a release by id', async () => {
    const client = createMockClient();
    vi.mocked(getRelease).mockResolvedValue(release);

    const { result } = renderHook(() => useRelease(release.id), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRelease).toHaveBeenCalledWith(client, '/api/cms', release.id);
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useRelease(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
