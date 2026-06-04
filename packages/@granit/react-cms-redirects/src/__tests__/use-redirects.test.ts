import { listRedirects } from '@granit/cms-redirects';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRedirects } from '../hooks/use-redirects';
import { CmsRedirectsProvider } from '../providers/cms-redirects-provider';

import type { PagedResponse, RedirectResponse } from '@granit/cms-redirects';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-redirects', () => ({
  listRedirects: vi.fn(),
}));

const redirect: RedirectResponse = {
  id: 'r-1',
  siteId: 'site-1',
  fromPath: '/old',
  toPath: '/new',
  culture: null,
  statusCode: 301,
  isEnabled: true,
};

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

  it('fetches paged redirects', async () => {
    const client = createMockClient();
    const paged: PagedResponse<RedirectResponse> = {
      items: [redirect],
      totalCount: 1,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(listRedirects).mockResolvedValue(paged);

    const { result } = renderHook(() => useRedirects({ siteId: 'site-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listRedirects).toHaveBeenCalledWith(client, '', { siteId: 'site-1' });
    expect(result.current.data).toEqual(paged);
  });

  it('fetches without params', async () => {
    const client = createMockClient();
    vi.mocked(listRedirects).mockResolvedValue({ items: [], totalCount: 0, page: 0, pageSize: 20 });

    const { result } = renderHook(() => useRedirects(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listRedirects).toHaveBeenCalledWith(client, '', undefined);
  });
});
