import {
  addReleaseAction,
  cancelRelease,
  createRelease,
  publishRelease,
  removeReleaseAction,
  scheduleRelease,
  updateRelease,
} from '@granit/cms';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAddReleaseAction,
  useCancelRelease,
  useCreateRelease,
  usePublishRelease,
  useRemoveReleaseAction,
  useScheduleRelease,
  useUpdateRelease,
} from '../hooks/use-release-mutations';
import { CmsProvider } from '../providers/cms-provider';

import type { ReleaseResponse } from '@granit/cms';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/cms', () => ({
  createRelease: vi.fn(),
  updateRelease: vi.fn(),
  addReleaseAction: vi.fn(),
  removeReleaseAction: vi.fn(),
  scheduleRelease: vi.fn(),
  cancelRelease: vi.fn(),
  publishRelease: vi.fn(),
}));

const release: ReleaseResponse = {
  id: 'rel-1',
  siteId: 'site-1',
  name: 'Sprint 1',
  status: 'Draft',
  schedule: null,
  tenantId: null,
  actions: [],
  concurrencyStamp: 'stamp-1',
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

describe('useCreateRelease', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls createRelease', async () => {
    const client = createMockClient();
    vi.mocked(createRelease).mockResolvedValue(release);

    const { result } = renderHook(() => useCreateRelease(), { wrapper: createWrapper(client) });
    result.current.mutate({ siteId: 'site-1', name: 'Sprint 1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createRelease).toHaveBeenCalledWith(client, '', { siteId: 'site-1', name: 'Sprint 1' });
  });
});

describe('useUpdateRelease', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateRelease', async () => {
    const client = createMockClient();
    vi.mocked(updateRelease).mockResolvedValue(release);

    const { result } = renderHook(() => useUpdateRelease(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'rel-1', request: { name: 'Sprint 1 v2' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateRelease).toHaveBeenCalledWith(client, '', 'rel-1', { name: 'Sprint 1 v2' });
  });
});

describe('useAddReleaseAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls addReleaseAction', async () => {
    const client = createMockClient();
    vi.mocked(addReleaseAction).mockResolvedValue(release);

    const req = {
      contentType: 'page',
      contentId: 'page-1',
      culture: 'fr',
      type: 'Publish' as const,
    };
    const { result } = renderHook(() => useAddReleaseAction(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'rel-1', request: req });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addReleaseAction).toHaveBeenCalledWith(client, '', 'rel-1', req);
  });
});

describe('useRemoveReleaseAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls removeReleaseAction', async () => {
    const client = createMockClient();
    vi.mocked(removeReleaseAction).mockResolvedValue(release);

    const { result } = renderHook(() => useRemoveReleaseAction(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ id: 'rel-1', actionId: 'action-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeReleaseAction).toHaveBeenCalledWith(client, '', 'rel-1', 'action-1');
  });
});

describe('useScheduleRelease', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls scheduleRelease', async () => {
    const client = createMockClient();
    vi.mocked(scheduleRelease).mockResolvedValue({ ...release, status: 'Ready' });

    const req = { localDateTime: '2026-07-01T09:00:00', timeZoneId: 'Europe/Brussels' };
    const { result } = renderHook(() => useScheduleRelease(), { wrapper: createWrapper(client) });
    result.current.mutate({ id: 'rel-1', request: req });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(scheduleRelease).toHaveBeenCalledWith(client, '', 'rel-1', req);
  });
});

describe('useCancelRelease', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls cancelRelease', async () => {
    const client = createMockClient();
    vi.mocked(cancelRelease).mockResolvedValue({ ...release, status: 'Draft' });

    const { result } = renderHook(() => useCancelRelease(), { wrapper: createWrapper(client) });
    result.current.mutate('rel-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cancelRelease).toHaveBeenCalledWith(client, '', 'rel-1');
  });
});

describe('usePublishRelease', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls publishRelease', async () => {
    const client = createMockClient();
    vi.mocked(publishRelease).mockResolvedValue({ ...release, status: 'Done' });

    const { result } = renderHook(() => usePublishRelease(), { wrapper: createWrapper(client) });
    result.current.mutate('rel-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(publishRelease).toHaveBeenCalledWith(client, '', 'rel-1');
  });
});
