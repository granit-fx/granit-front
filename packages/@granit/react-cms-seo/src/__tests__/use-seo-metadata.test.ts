import {
  getJsonLdPreview,
  getOgCardPreview,
  getSeoDefaults,
  getSeoMetadata,
  getSerpPreview,
  listSeoAuditIssues,
} from '@granit/cms-seo';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useJsonLdPreview,
  useOgCardPreview,
  useSeoAuditIssues,
  useSeoDefaults,
  useSeoMetadata,
  useSerpPreview,
} from '../hooks/use-seo-metadata';
import { CmsSeoProvider } from '../providers/cms-seo-provider';

import type {
  OgCardPreviewResponse,
  PagedResponse,
  SeoAuditIssueResponse,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-seo', () => ({
  getSeoMetadata: vi.fn(),
  getSeoDefaults: vi.fn(),
  getSerpPreview: vi.fn(),
  getOgCardPreview: vi.fn(),
  getJsonLdPreview: vi.fn(),
  listSeoAuditIssues: vi.fn(),
}));

const KEY = { siteId: 'site-1', contentType: 'page', contentId: 'page-1', culture: 'fr' };
const metadata: SeoMetadataResponse = {
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  title: 'Test',
};
const defaults: SiteSeoDefaultsResponse = { siteId: 'site-1', siteName: 'ACME' };

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CmsSeoProvider, { config: { client }, children })
    );
  };
}

describe('useSeoMetadata', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches raw SEO metadata', async () => {
    const client = createMockClient();
    vi.mocked(getSeoMetadata).mockResolvedValue(metadata);

    const { result } = renderHook(() => useSeoMetadata(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSeoMetadata).toHaveBeenCalledWith(client, '', KEY);
    expect(result.current.data).toEqual(metadata);
  });

  it('returns null when getSeoMetadata returns null', async () => {
    const client = createMockClient();
    vi.mocked(getSeoMetadata).mockResolvedValue(null);

    const { result } = renderHook(() => useSeoMetadata(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useSeoDefaults', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches site SEO defaults', async () => {
    const client = createMockClient();
    vi.mocked(getSeoDefaults).mockResolvedValue(defaults);

    const { result } = renderHook(() => useSeoDefaults('site-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSeoDefaults).toHaveBeenCalledWith(client, '', 'site-1');
  });

  it('is disabled when siteId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useSeoDefaults(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSeoAuditIssues', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches audit issues', async () => {
    const client = createMockClient();
    const paged: PagedResponse<SeoAuditIssueResponse> = {
      items: [
        { contentType: 'page', contentId: 'p-1', culture: 'fr', issueType: 'MissingDescription' },
      ],
      totalCount: 1,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(listSeoAuditIssues).mockResolvedValue(paged);

    const { result } = renderHook(() => useSeoAuditIssues(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSeoAuditIssues).toHaveBeenCalledWith(client, '', undefined);
  });
});

describe('useSerpPreview', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches SERP preview', async () => {
    const client = createMockClient();
    const preview: SerpPreviewResponse = {
      title: 'T',
      url: 'https://example.com',
      description: 'D',
    };
    vi.mocked(getSerpPreview).mockResolvedValue(preview);

    const { result } = renderHook(() => useSerpPreview(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSerpPreview).toHaveBeenCalledWith(client, '', KEY);
  });
});

describe('useOgCardPreview', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches OG card preview', async () => {
    const client = createMockClient();
    const preview: OgCardPreviewResponse = { title: 'T', description: 'D', siteName: 'S' };
    vi.mocked(getOgCardPreview).mockResolvedValue(preview);

    const { result } = renderHook(() => useOgCardPreview(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getOgCardPreview).toHaveBeenCalledWith(client, '', KEY);
  });
});

describe('useJsonLdPreview', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches JSON-LD preview', async () => {
    const client = createMockClient();
    const graph = [{ '@type': 'WebPage' }];
    vi.mocked(getJsonLdPreview).mockResolvedValue(graph);

    const { result } = renderHook(() => useJsonLdPreview(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getJsonLdPreview).toHaveBeenCalledWith(client, '', KEY);
  });
});
