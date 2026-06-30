import {
  getEffectiveSeo,
  getJsonLdPreview,
  getOgCardPreview,
  getSeoDefaults,
  getSeoMetadata,
  getSerpPreview,
  listSeoMetadata,
} from '@granit/cms-seo';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockSeoDefaults, mockSeoMetadataAudit } from '@granit/react-cms-seo/testing';

import {
  useEffectiveSeo,
  useJsonLdPreview,
  useOgCardPreview,
  useSeoDefaults,
  useSeoMetadata,
  useSeoMetadataAudit,
  useSerpPreview,
} from '../hooks/use-seo-metadata';
import { CmsSeoProvider } from '../providers/cms-seo-provider';

import type {
  EffectiveSeoResponse,
  OgPreviewResponse,
  PagedResult,
  RobotsDirective,
  SeoMetadataListItem,
  SeoMetadataResponse,
  SerpPreviewResponse,
} from '@granit/cms-seo';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-seo', () => ({
  getEffectiveSeo: vi.fn(),
  getSeoMetadata: vi.fn(),
  getSeoDefaults: vi.fn(),
  getSerpPreview: vi.fn(),
  getOgCardPreview: vi.fn(),
  getJsonLdPreview: vi.fn(),
  listSeoMetadata: vi.fn(),
}));

const KEY = { siteId: 'site-1', contentType: 'page', contentId: 'page-1', culture: 'fr' };

const robots: RobotsDirective = {
  index: true,
  follow: true,
  noArchive: false,
  noSnippet: false,
  maxSnippet: null,
  maxImagePreview: null,
};

const metadata: SeoMetadataResponse = {
  id: 'm-1',
  siteId: 'site-1',
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  title: 'Test',
  titleTemplate: null,
  description: null,
  keywords: [],
  canonicalUrl: null,
  robots,
  openGraph: null,
  twitterCard: null,
  structuredDataExtras: null,
  disableAutoJsonLd: false,
  alternateOverrides: [],
  xDefaultCulture: null,
  statusAtLastReview: 'NeedsReview',
  lastReviewedAt: null,
  createdAt: toISODateString('2026-01-01T00:00:00+00:00'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';
const defaults = mockSeoDefaults[CORPORATE_SITE_ID]!;

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
    expect(getSeoMetadata).toHaveBeenCalledWith(client, '/api/cms/seo', KEY);
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

describe('useEffectiveSeo', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the cascade-resolved SEO with a seed', async () => {
    const client = createMockClient();
    const effective: EffectiveSeoResponse = {
      title: 'T',
      description: null,
      canonicalUrl: null,
      robots,
      keywords: [],
      openGraph: {
        type: 'website',
        title: null,
        description: null,
        url: null,
        siteName: null,
        locale: null,
        alternateLocales: [],
        image: null,
        article: null,
      },
      twitterCard: {
        card: 'summary_large_image',
        title: null,
        description: null,
        image: null,
        site: null,
        creator: null,
      },
      alternates: [],
    };
    vi.mocked(getEffectiveSeo).mockResolvedValue(effective);

    const { result } = renderHook(() => useEffectiveSeo(KEY, { contentTitle: 'Seed' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getEffectiveSeo).toHaveBeenCalledWith(client, '/api/cms/seo', {
      ...KEY,
      contentTitle: 'Seed',
    });
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
    expect(getSeoDefaults).toHaveBeenCalledWith(client, '/api/cms/seo', 'site-1');
  });

  it('is disabled when siteId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useSeoDefaults(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSeoMetadataAudit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the audit grid page', async () => {
    const client = createMockClient();
    const item = mockSeoMetadataAudit[0]!;
    const paged: PagedResult<SeoMetadataListItem> = {
      items: [item],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(listSeoMetadata).mockResolvedValue(paged);

    const { result } = renderHook(() => useSeoMetadataAudit(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listSeoMetadata).toHaveBeenCalledWith(
      client,
      '/api/cms/seo',
      undefined,
      expect.objectContaining({})
    );
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
      description: 'D',
      displayUrl: 'https://example.com',
    };
    vi.mocked(getSerpPreview).mockResolvedValue(preview);

    const { result } = renderHook(() => useSerpPreview(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSerpPreview).toHaveBeenCalledWith(client, '/api/cms/seo', KEY);
  });
});

describe('useOgCardPreview', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches OG card preview', async () => {
    const client = createMockClient();
    const preview: OgPreviewResponse = {
      type: 'website',
      title: 'T',
      description: 'D',
      imageUrl: null,
      siteName: 'S',
    };
    vi.mocked(getOgCardPreview).mockResolvedValue(preview);

    const { result } = renderHook(() => useOgCardPreview(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getOgCardPreview).toHaveBeenCalledWith(client, '/api/cms/seo', KEY);
  });
});

describe('useJsonLdPreview', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches JSON-LD preview', async () => {
    const client = createMockClient();
    const graph = '{"@graph":[{"@type":"WebPage"}]}';
    vi.mocked(getJsonLdPreview).mockResolvedValue(graph);

    const { result } = renderHook(() => useJsonLdPreview(KEY), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getJsonLdPreview).toHaveBeenCalledWith(client, '/api/cms/seo', KEY);
  });
});
