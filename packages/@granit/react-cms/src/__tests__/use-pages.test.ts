import { getPage, getPageTree, listPageVersions, listPages } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePage, usePageTree, usePageVersions, usePages } from '../hooks/use-pages';
import { CmsProvider } from '../providers/cms-provider';

import type {
  PageResponse,
  PageTreeNodeResponse,
  PageVersionSummaryResponse,
  PagedResponse,
} from '@granit/cms';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  getPageTree: vi.fn(),
  listPages: vi.fn(),
  getPage: vi.fn(),
  listPageVersions: vi.fn(),
}));

const treeNode: PageTreeNodeResponse = {
  id: 'page-1',
  parentId: null,
  slugSegment: 'home',
  structurePath: '/home',
  depth: 0,
  isSiteRoot: true,
};
const page: PageResponse = {
  id: 'page-1',
  siteId: 'site-1',
  parentId: null,
  slugSegment: 'home',
  structurePath: '/home',
  depth: 0,
  kind: 'standard',
  isSiteRoot: true,
  layoutKey: null,
  translations: [],
};
const version: PageVersionSummaryResponse = {
  versionId: 'v-1',
  version: 1,
  lifecycleStatus: 'Draft',
  isPublished: false,
  publishedAt: null,
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

describe('usePageTree', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches page tree for a site', async () => {
    const client = createMockClient();
    vi.mocked(getPageTree).mockResolvedValue([treeNode]);

    const { result } = renderHook(() => usePageTree('site-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPageTree).toHaveBeenCalledWith(client, '', 'site-1');
  });

  it('is disabled when siteId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePageTree(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePages', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paged list of pages', async () => {
    const client = createMockClient();
    const paged: PagedResponse<PageResponse> = {
      items: [page],
      totalCount: 1,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(listPages).mockResolvedValue(paged);

    const { result } = renderHook(() => usePages({ siteId: 'site-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listPages).toHaveBeenCalledWith(client, '', { siteId: 'site-1' });
  });
});

describe('usePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches page by id', async () => {
    const client = createMockClient();
    vi.mocked(getPage).mockResolvedValue(page);

    const { result } = renderHook(() => usePage('page-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getPage).toHaveBeenCalledWith(client, '', 'page-1');
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePage(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePageVersions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches versions for a page', async () => {
    const client = createMockClient();
    vi.mocked(listPageVersions).mockResolvedValue([version]);

    const { result } = renderHook(() => usePageVersions('page-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listPageVersions).toHaveBeenCalledWith(client, '', 'page-1');
  });
});
