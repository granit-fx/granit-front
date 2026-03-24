import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSavedViews } from '../hooks/use-saved-views.js';
import { QueryProvider } from '../providers/query-provider.js';

import type { QueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(config: QueryConfig) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <QueryProvider config={config}>{children}</QueryProvider>
      </QueryClientProvider>
    );
  };
}

const savedView = {
  id: 'view-1',
  name: 'My View',
  isShared: false,
  isDefault: false,
  filterJson: '{}',
};

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useSavedViews — list
// ---------------------------------------------------------------------------

describe('useSavedViews', () => {
  it('should fetch saved views', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: [savedView] });

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.views.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/saved-views');
    expect(result.current.views.data).toEqual([savedView]);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  it('should create a saved view', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: [] });
    vi.spyOn(client, 'post').mockResolvedValue({ data: savedView });

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.views.isSuccess).toBe(true));

    await act(async () => {
      result.current.create.mutate({
        name: 'My View',
        isShared: false,
        isDefault: false,
        filterJson: '{}',
      });
    });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/patients/saved-views', {
      name: 'My View',
      isShared: false,
      isDefault: false,
      filterJson: '{}',
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  it('should update a saved view', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: [savedView] });
    vi.spyOn(client, 'put').mockResolvedValue({ data: { ...savedView, name: 'Renamed' } });

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.views.isSuccess).toBe(true));

    await act(async () => {
      result.current.update.mutate({
        id: 'view-1',
        request: { name: 'Renamed', isShared: false, isDefault: false, filterJson: '{}' },
      });
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/patients/saved-views/view-1', {
      name: 'Renamed',
      isShared: false,
      isDefault: false,
      filterJson: '{}',
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  it('should delete a saved view', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: [savedView] });
    vi.spyOn(client, 'delete').mockResolvedValue({ data: undefined });

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.views.isSuccess).toBe(true));

    await act(async () => {
      result.current.remove.mutate('view-1');
    });

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith('/api/v1/patients/saved-views/view-1');
  });

  // ---------------------------------------------------------------------------
  // setDefault
  // ---------------------------------------------------------------------------

  it('should set a saved view as default', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: [savedView] });
    vi.spyOn(client, 'post').mockResolvedValue({ data: { ...savedView, isDefault: true } });

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.views.isSuccess).toBe(true));

    await act(async () => {
      result.current.setDefault.mutate('view-1');
    });

    await waitFor(() => expect(result.current.setDefault.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/patients/saved-views/view-1/set-default');
  });

  // ---------------------------------------------------------------------------
  // error handling
  // ---------------------------------------------------------------------------

  it('should expose error on create failure', async () => {
    const client = axios.create();
    vi.spyOn(client, 'get').mockResolvedValue({ data: [] });
    vi.spyOn(client, 'post').mockRejectedValue(new Error('Conflict'));

    const config: QueryConfig = { client, basePath: '/api/v1/patients' };

    const { result } = renderHook(() => useSavedViews(), {
      wrapper: createWrapper(config),
    });

    await waitFor(() => expect(result.current.views.isSuccess).toBe(true));

    await act(async () => {
      result.current.create.mutate({
        name: 'Dup',
        isShared: false,
        isDefault: false,
        filterJson: '{}',
      });
    });

    await waitFor(() => expect(result.current.create.error).not.toBeNull());
    expect(result.current.create.error?.message).toBe('Conflict');
  });
});
