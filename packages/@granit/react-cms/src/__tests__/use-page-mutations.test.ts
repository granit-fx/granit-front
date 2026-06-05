import {
  createPage,
  deletePage,
  movePage,
  publishPage,
  rollbackPage,
  saveDraft,
  unpublishPage,
  updatePage,
  updatePageTranslation,
} from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCreatePage,
  useDeletePage,
  useMovePage,
  usePublishPage,
  useRollbackPage,
  useSaveDraft,
  useUnpublishPage,
  useUpdatePage,
  useUpdatePageTranslation,
} from '../hooks/use-page-mutations';
import { CmsProvider } from '../providers/cms-provider';

import type { PageResponse, PageVersionSummaryResponse } from '@granit/cms';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  createPage: vi.fn(),
  updatePage: vi.fn(),
  updatePageTranslation: vi.fn(),
  movePage: vi.fn(),
  deletePage: vi.fn(),
  saveDraft: vi.fn(),
  publishPage: vi.fn(),
  unpublishPage: vi.fn(),
  rollbackPage: vi.fn(),
}));

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

describe('useCreatePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls createPage with request', async () => {
    const client = createMockClient();
    vi.mocked(createPage).mockResolvedValue(page);

    const { result } = renderHook(() => useCreatePage(), { wrapper: createWrapper(client) });
    result.current.mutate({ parentId: 'parent-1', slugSegment: 'home', layoutKey: null });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createPage).toHaveBeenCalledWith(client, '', {
      parentId: 'parent-1',
      slugSegment: 'home',
      layoutKey: null,
    });
  });
});

describe('useUpdatePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updatePage with id and request', async () => {
    const client = createMockClient();
    vi.mocked(updatePage).mockResolvedValue(page);

    const { result } = renderHook(() => useUpdatePage(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'page-1', request: { slugSegment: 'new-home' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updatePage).toHaveBeenCalledWith(client, '', 'page-1', { slugSegment: 'new-home' });
  });
});

describe('useUpdatePageTranslation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updatePageTranslation', async () => {
    const client = createMockClient();
    vi.mocked(updatePageTranslation).mockResolvedValue(page);

    const { result } = renderHook(() => useUpdatePageTranslation(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({
      id: 'page-1',
      culture: 'fr',
      request: { urlSlug: 'accueil', title: 'Accueil' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updatePageTranslation).toHaveBeenCalledWith(client, '', 'page-1', 'fr', {
      urlSlug: 'accueil',
      title: 'Accueil',
    });
  });
});

describe('useMovePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls movePage', async () => {
    const client = createMockClient();
    vi.mocked(movePage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMovePage(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'page-1', request: { newParentId: 'parent-1' }, siteId: 'site-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(movePage).toHaveBeenCalledWith(client, '', 'page-1', { newParentId: 'parent-1' });
  });
});

describe('useDeletePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls deletePage', async () => {
    const client = createMockClient();
    vi.mocked(deletePage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeletePage(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'page-1', siteId: 'site-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deletePage).toHaveBeenCalledWith(client, '', 'page-1');
  });
});

describe('useSaveDraft', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok:true on success', async () => {
    const client = createMockClient();
    vi.mocked(saveDraft).mockResolvedValue({ ok: true, version });

    const { result } = renderHook(() => useSaveDraft(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'page-1', culture: 'fr', request: { contentJson: '{}' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ ok: true, version });
  });
});

describe('usePublishPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls publishPage', async () => {
    const client = createMockClient();
    vi.mocked(publishPage).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePublishPage(), { wrapper: createWrapper(client) });
    result.current.mutate('page-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(publishPage).toHaveBeenCalledWith(client, '', 'page-1');
  });
});

describe('useUnpublishPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls unpublishPage', async () => {
    const client = createMockClient();
    vi.mocked(unpublishPage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUnpublishPage(), { wrapper: createWrapper(client) });
    result.current.mutate('page-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(unpublishPage).toHaveBeenCalledWith(client, '', 'page-1');
  });
});

describe('useRollbackPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls rollbackPage with id and versionId', async () => {
    const client = createMockClient();
    vi.mocked(rollbackPage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRollbackPage(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'page-1', versionId: 'v-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rollbackPage).toHaveBeenCalledWith(client, '', 'page-1', 'v-1');
  });
});
