import { createRedirect, deleteRedirect, updateRedirect } from '@granit/cms-redirects';
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
} from '../hooks/use-redirect-mutations';
import { CmsRedirectsProvider } from '../providers/cms-redirects-provider';

import type { RedirectResponse } from '@granit/cms-redirects';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms-redirects', () => ({
  createRedirect: vi.fn(),
  updateRedirect: vi.fn(),
  deleteRedirect: vi.fn(),
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

describe('useCreateRedirect', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls createRedirect', async () => {
    const client = createMockClient();
    vi.mocked(createRedirect).mockResolvedValue(redirect);

    const req = { siteId: 'site-1', fromPath: '/old', toPath: '/new' };
    const { result } = renderHook(() => useCreateRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate(req);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createRedirect).toHaveBeenCalledWith(client, '', req);
  });
});

describe('useUpdateRedirect', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateRedirect', async () => {
    const client = createMockClient();
    vi.mocked(updateRedirect).mockResolvedValue(redirect);

    const req = { fromPath: '/old', toPath: '/new-v2' };
    const { result } = renderHook(() => useUpdateRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'r-1', request: req });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateRedirect).toHaveBeenCalledWith(client, '', 'r-1', req);
  });
});

describe('useDeleteRedirect', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteRedirect', async () => {
    const client = createMockClient();
    vi.mocked(deleteRedirect).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRedirect(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'r-1', siteId: 'site-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteRedirect).toHaveBeenCalledWith(client, '', 'r-1');
  });
});
