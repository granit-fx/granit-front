import { getMenu, listMenus } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockMenus } from '@granit/react-cms/testing';

import { useMenu, useMenus } from '../hooks/use-menus-admin';
import { CmsProvider } from '../providers/cms-provider';

import type { MenuResponse } from '@granit/cms';
import type { PagedResult } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  listMenus: vi.fn(),
  getMenu: vi.fn(),
}));

const menu = mockMenus[0]!;

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

describe('useMenus', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paged menus', async () => {
    const client = createMockClient();
    const paged: PagedResult<MenuResponse> = {
      items: [menu],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(listMenus).mockResolvedValue(paged);

    const { result } = renderHook(() => useMenus({ page: 1, pageSize: 20 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMenus).toHaveBeenCalledWith(
      client,
      '/api/cms',
      { page: 1, pageSize: 20 },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});

describe('useMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a menu by id', async () => {
    const client = createMockClient();
    vi.mocked(getMenu).mockResolvedValue(menu);

    const { result } = renderHook(() => useMenu(menu.id), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMenu).toHaveBeenCalledWith(client, '/api/cms', menu.id);
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useMenu(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
