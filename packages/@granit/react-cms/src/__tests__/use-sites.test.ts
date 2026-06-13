import { getSite, listSites } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSite, useSites } from '../hooks/use-sites';
import { CmsProvider } from '../providers/cms-provider';

import type { SiteResponse } from '@granit/cms';
import type { PagedResult } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  listSites: vi.fn(),
  getSite: vi.fn(),
}));

const site: SiteResponse = {
  id: 'site-1',
  slug: 'acme',
  defaultCulture: 'fr',
  allowedCultures: ['fr'],
  domains: [],
  defaultTheme: 'default',
  activated: true,
  tenantId: null,
  displayNames: {},
};

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

describe('useSites', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paged sites list', async () => {
    const client = createMockClient();
    const paged: PagedResult<SiteResponse> = {
      items: [site],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(listSites).mockResolvedValue(paged);

    const { result } = renderHook(() => useSites(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSites).toHaveBeenCalledWith(
      client,
      '',
      undefined,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result.current.data).toEqual(paged);
  });

  it('passes params to listSites', async () => {
    const client = createMockClient();
    vi.mocked(listSites).mockResolvedValue({
      items: [],
      totalCount: 0,
      hasMore: false,
      nextCursor: null,
    });

    const { result } = renderHook(() => useSites({ page: 1, pageSize: 10 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSites).toHaveBeenCalledWith(
      client,
      '',
      { page: 1, pageSize: 10 },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});

describe('useSite', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single site by id', async () => {
    const client = createMockClient();
    vi.mocked(getSite).mockResolvedValue(site);

    const { result } = renderHook(() => useSite('site-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSite).toHaveBeenCalledWith(client, '', 'site-1');
    expect(result.current.data).toEqual(site);
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useSite(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getSite).not.toHaveBeenCalled();
  });
});
