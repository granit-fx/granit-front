import { getMenu, listMenus } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMenu, useMenus } from '../hooks/use-menus-admin';
import { CmsProvider } from '../providers/cms-provider';

import type { MenuResponse, PagedResponse } from '@granit/cms';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  listMenus: vi.fn(),
  getMenu: vi.fn(),
}));

const menu: MenuResponse = {
  id: 'menu-1',
  siteId: 'site-1',
  key: 'main',
  title: 'Main navigation',
  items: [],
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

describe('useMenus', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paged menus', async () => {
    const client = createMockClient();
    const paged: PagedResponse<MenuResponse> = {
      items: [menu],
      totalCount: 1,
      page: 0,
      pageSize: 20,
    };
    vi.mocked(listMenus).mockResolvedValue(paged);

    const { result } = renderHook(() => useMenus({ siteId: 'site-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMenus).toHaveBeenCalledWith(client, '', { siteId: 'site-1' });
  });
});

describe('useMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a menu by id', async () => {
    const client = createMockClient();
    vi.mocked(getMenu).mockResolvedValue(menu);

    const { result } = renderHook(() => useMenu('menu-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMenu).toHaveBeenCalledWith(client, '', 'menu-1');
  });

  it('is disabled when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useMenu(''), { wrapper: createWrapper(client) });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
