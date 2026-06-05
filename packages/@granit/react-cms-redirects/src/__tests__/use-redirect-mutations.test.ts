import {
  createRedirect,
  deleteRedirect,
  updateRedirect,
  updateRedirectSettings,
} from '@granit/cms-redirects';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCreateRedirect,
  useDeleteRedirect,
  useUpdateRedirect,
  useUpdateRedirectSettings,
} from '../hooks/use-redirect-mutations';
import { CmsRedirectsProvider } from '../providers/cms-redirects-provider';

import type {
  RedirectMutationResult,
  RedirectResponse,
  SiteRedirectSettingsResponse,
} from '@granit/cms-redirects';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-redirects', () => ({
  createRedirect: vi.fn(),
  updateRedirect: vi.fn(),
  deleteRedirect: vi.fn(),
  updateRedirectSettings: vi.fn(),
}));

const redirect: RedirectResponse = {
  id: 'r-1',
  siteId: 'site-1',
  source: '/old',
  matchType: 'Exact',
  target: '/new',
  type: 'MovedPermanently',
  statusCode: 301,
  isActive: true,
  culture: null,
  origin: 'Manual',
  hitCount: 0,
  lastHitAt: null,
};

const mutationResult: RedirectMutationResult = { redirect, conflictWarning: null };

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

describe('useCreateRedirect', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls createRedirect with siteId and exposes the mutation result', async () => {
    const client = createMockClient();
    vi.mocked(createRedirect).mockResolvedValue(mutationResult);

    const request = { source: '/old', target: '/new' };
    const { result } = renderHook(() => useCreateRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate({ siteId: 'site-1', request });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createRedirect).toHaveBeenCalledWith(client, '', 'site-1', request);
    expect(result.current.data).toEqual(mutationResult);
  });

  it('surfaces a conflict warning', async () => {
    const client = createMockClient();
    vi.mocked(createRedirect).mockResolvedValue({
      redirect,
      conflictWarning: 'shadows a live page',
    });

    const { result } = renderHook(() => useCreateRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate({ siteId: 'site-1', request: { source: '/old', target: '/new' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.conflictWarning).toBe('shadows a live page');
  });
});

describe('useUpdateRedirect', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls updateRedirect', async () => {
    const client = createMockClient();
    vi.mocked(updateRedirect).mockResolvedValue(mutationResult);

    const request = { target: '/new-v2' };
    const { result } = renderHook(() => useUpdateRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'r-1', request });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateRedirect).toHaveBeenCalledWith(client, '', 'r-1', request);
  });
});

describe('useDeleteRedirect', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls deleteRedirect', async () => {
    const client = createMockClient();
    vi.mocked(deleteRedirect).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'r-1', siteId: 'site-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteRedirect).toHaveBeenCalledWith(client, '', 'r-1');
  });
});

describe('useUpdateRedirectSettings', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls updateRedirectSettings', async () => {
    const client = createMockClient();
    const settings: SiteRedirectSettingsResponse = { siteId: 'site-1', autoRedirectOnMove: false };
    vi.mocked(updateRedirectSettings).mockResolvedValue(settings);

    const request = { autoRedirectOnMove: false };
    const { result } = renderHook(() => useUpdateRedirectSettings(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ siteId: 'site-1', request });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateRedirectSettings).toHaveBeenCalledWith(client, '', 'site-1', request);
  });
});
