import { createMenu, deleteMenu, updateMenu } from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCreateMenu, useDeleteMenu, useUpdateMenu } from '../hooks/use-menu-mutations';
import { CmsProvider } from '../providers/cms-provider';

import type { MenuResponse } from '@granit/cms';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  deleteMenu: vi.fn(),
}));

const menu: MenuResponse = {
  id: 'menu-1',
  siteId: 'site-1',
  key: 'main',
  title: 'Main navigation',
  items: [],
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
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

describe('useCreateMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls createMenu', async () => {
    const client = createMockClient();
    vi.mocked(createMenu).mockResolvedValue(menu);

    const { result } = renderHook(() => useCreateMenu(), { wrapper: createWrapper(client) });
    result.current.mutate({ siteId: 'site-1', key: 'main', title: 'Main navigation' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createMenu).toHaveBeenCalledWith(client, '', {
      siteId: 'site-1',
      key: 'main',
      title: 'Main navigation',
    });
  });
});

describe('useUpdateMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateMenu with id and request', async () => {
    const client = createMockClient();
    vi.mocked(updateMenu).mockResolvedValue(menu);

    const { result } = renderHook(() => useUpdateMenu(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'menu-1', request: { title: 'Primary nav', items: [] } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateMenu).toHaveBeenCalledWith(client, '', 'menu-1', {
      title: 'Primary nav',
      items: [],
    });
  });
});

describe('useDeleteMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteMenu', async () => {
    const client = createMockClient();
    vi.mocked(deleteMenu).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteMenu(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'menu-1', siteId: 'site-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteMenu).toHaveBeenCalledWith(client, '', 'menu-1');
  });
});
