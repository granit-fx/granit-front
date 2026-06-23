import { createSite, deleteSite, updateSite } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockSites } from '@granit/react-cms/testing';

import { useCreateSite, useDeleteSite, useUpdateSite } from '../hooks/use-site-mutations';
import { CmsProvider } from '../providers/cms-provider';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  createSite: vi.fn(),
  updateSite: vi.fn(),
  deleteSite: vi.fn(),
}));

const site = mockSites[0]!;

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

describe('useCreateSite', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls createSite and succeeds', async () => {
    const client = createMockClient();
    vi.mocked(createSite).mockResolvedValue(site);

    const { result } = renderHook(() => useCreateSite(), { wrapper: createWrapper(client) });
    result.current.mutate({ slug: 'acme', defaultCulture: 'fr', allowedCultures: ['fr'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createSite).toHaveBeenCalledWith(client, '', {
      slug: 'acme',
      defaultCulture: 'fr',
      allowedCultures: ['fr'],
    });
  });
});

describe('useUpdateSite', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSite with id and request', async () => {
    const client = createMockClient();
    vi.mocked(updateSite).mockResolvedValue(site);

    const request = {
      defaultCulture: 'fr',
      allowedCultures: ['fr'],
      domains: [],
      defaultTheme: 'default',
      activated: true,
    };
    const { result } = renderHook(() => useUpdateSite(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: site.id, request });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateSite).toHaveBeenCalledWith(client, '', site.id, request);
  });
});

describe('useDeleteSite', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteSite with id', async () => {
    const client = createMockClient();
    vi.mocked(deleteSite).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSite(), { wrapper: createWrapper(client) });
    result.current.mutate(site.id);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteSite).toHaveBeenCalledWith(client, '', site.id);
  });
});
