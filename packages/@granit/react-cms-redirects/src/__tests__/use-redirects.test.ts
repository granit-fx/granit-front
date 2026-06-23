import {
  getRedirect,
  getRedirectsGrid,
  getRedirectSettings,
  listRedirects,
  previewRedirect,
} from '@granit/cms-redirects';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockRedirects } from '@granit/react-cms-redirects/testing';

import {
  useRedirect,
  useRedirectPreview,
  useRedirects,
  useRedirectsGrid,
  useRedirectSettings,
} from '../hooks/use-redirects';
import { CmsRedirectsProvider } from '../providers/cms-redirects-provider';

import type {
  PagedResult,
  RedirectPreviewResponse,
  RedirectResponse,
  SiteRedirectSettingsResponse,
} from '@granit/cms-redirects';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-redirects', () => ({
  listRedirects: vi.fn(),
  getRedirect: vi.fn(),
  getRedirectsGrid: vi.fn(),
  getRedirectSettings: vi.fn(),
  previewRedirect: vi.fn(),
}));

const redirect = mockRedirects[0]!;

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CmsRedirectsProvider, { config: { client }, children })
    );
  };
}

describe('useRedirects', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a flat list for the site', async () => {
    const client = createMockClient();
    vi.mocked(listRedirects).mockResolvedValue([redirect]);

    const { result } = renderHook(() => useRedirects('site-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listRedirects).toHaveBeenCalledWith(client, '', 'site-1');
    expect(result.current.data).toEqual([redirect]);
  });

  it('is disabled when siteId is empty', () => {
    const client = createMockClient();
    vi.mocked(listRedirects).mockResolvedValue([]);

    renderHook(() => useRedirects(''), { wrapper: createWrapper(client) });

    expect(listRedirects).not.toHaveBeenCalled();
  });
});

describe('useRedirect', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches a redirect by id', async () => {
    const client = createMockClient();
    vi.mocked(getRedirect).mockResolvedValue(redirect);

    const { result } = renderHook(() => useRedirect(redirect.id), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRedirect).toHaveBeenCalledWith(client, '', redirect.id);
  });
});

describe('useRedirectsGrid', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches a page from the grid', async () => {
    const client = createMockClient();
    const page: PagedResult<RedirectResponse> = { items: [redirect], totalCount: 1 };
    vi.mocked(getRedirectsGrid).mockResolvedValue(page);

    const { result } = renderHook(() => useRedirectsGrid({ page: 1, pageSize: 25 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRedirectsGrid).toHaveBeenCalledWith(
      client,
      '',
      { page: 1, pageSize: 25 },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result.current.data).toEqual(page);
  });
});

describe('useRedirectSettings', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches a site settings', async () => {
    const client = createMockClient();
    const settings: SiteRedirectSettingsResponse = { siteId: 'site-1', autoRedirectOnMove: true };
    vi.mocked(getRedirectSettings).mockResolvedValue(settings);

    const { result } = renderHook(() => useRedirectSettings('site-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRedirectSettings).toHaveBeenCalledWith(client, '', 'site-1');
  });
});

describe('useRedirectPreview', () => {
  afterEach(() => vi.clearAllMocks());

  it('previews a candidate path', async () => {
    const client = createMockClient();
    const preview: RedirectPreviewResponse = { matched: true, target: '/new', statusCode: 301 };
    vi.mocked(previewRedirect).mockResolvedValue(preview);

    const { result } = renderHook(
      () => useRedirectPreview('site-1', { path: '/old', culture: 'fr' }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(previewRedirect).toHaveBeenCalledWith(client, '', 'site-1', {
      path: '/old',
      culture: 'fr',
    });
  });

  it('is disabled when path is empty', () => {
    const client = createMockClient();
    vi.mocked(previewRedirect).mockResolvedValue({
      matched: false,
      target: null,
      statusCode: null,
    });

    renderHook(() => useRedirectPreview('site-1', { path: '' }), {
      wrapper: createWrapper(client),
    });

    expect(previewRedirect).not.toHaveBeenCalled();
  });
});
