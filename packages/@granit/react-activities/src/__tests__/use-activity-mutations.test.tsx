import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCancelActivity,
  useCompleteActivity,
  useCreateActivity,
  useReassignActivity,
  useRescheduleActivity,
} from '../hooks/use-activity-mutations';
import { ActivitiesProvider } from '../providers/activities-provider';

import type { ActivityResponse } from '@granit/activities';
import type { AxiosInstance } from '@granit/api-client';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleActivity: ActivityResponse = {
  id: 'act-1',
  entityType: 'Quote',
  entityId: 'quote-1',
  type: 'FollowUp',
  assignedToUserId: 'user-1',
  createdByUserId: 'user-2',
  dueAt: '2026-05-10T10:00:00Z',
  description: null,
  status: 'Open',
  completedAt: null,
  completedByUserId: null,
  createdAt: '2026-05-01T08:00:00Z',
};

interface Harness {
  readonly client: AxiosInstance;
  readonly queryClient: QueryClient;
  readonly wrapper: (props: { children: ReactNode }) => React.ReactElement;
}

function createHarness(): Harness {
  const client = createMockClient();
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <ActivitiesProvider config={{ client }}>{children}</ActivitiesProvider>
    );
  return { client, queryClient, wrapper };
}

describe('useCreateActivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to the base path and invalidates list + calendar (no detail)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleActivity });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateActivity(), { wrapper });
    await result.current.mutateAsync({
      entityType: 'Quote',
      entityId: 'quote-1',
      type: 'FollowUp',
      assignedToUserId: 'user-1',
      dueAt: '2026-05-10T10:00:00Z',
      description: null,
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/activities', expect.any(Object));
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['activities', 'list'],
      ['activities', 'calendar'],
    ]);
  });

  it('does not invalidate when the mutation fails', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockRejectedValue(new Error('boom'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateActivity(), { wrapper });
    await expect(
      result.current.mutateAsync({
        entityType: 'Quote',
        entityId: 'quote-1',
        type: 'FollowUp',
        assignedToUserId: 'user-1',
        dueAt: '2026-05-10T10:00:00Z',
        description: null,
      })
    ).rejects.toThrow(/boom/);

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useCompleteActivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to {id}/complete and invalidates list + calendar + detail(id)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleActivity });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCompleteActivity(), { wrapper });
    await result.current.mutateAsync({
      id: 'act-1',
      request: { completedAt: '2026-05-09T15:00:00Z' },
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/activities/act-1/complete', {
      completedAt: '2026-05-09T15:00:00Z',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['activities', 'list'],
      ['activities', 'calendar'],
      ['activities', 'detail', 'act-1'],
    ]);
  });
});

describe('useCancelActivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to {id}/cancel and invalidates list + calendar + detail(id)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleActivity });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCancelActivity(), { wrapper });
    await result.current.mutateAsync({
      id: 'act-1',
      request: { cancelledAt: '2026-05-09T15:00:00Z' },
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/activities/act-1/cancel', {
      cancelledAt: '2026-05-09T15:00:00Z',
    });
    expect(invalidate.mock.calls.at(-1)?.[0]?.queryKey).toEqual(['activities', 'detail', 'act-1']);
  });
});

describe('useReassignActivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PUTs to {id}/assignee and invalidates list + calendar + detail(id)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.put).mockResolvedValue({ data: sampleActivity });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReassignActivity(), { wrapper });
    await result.current.mutateAsync({
      id: 'act-1',
      request: { newAssigneeUserId: 'user-3' },
    });

    expect(client.put).toHaveBeenCalledWith('/api/v1/activities/act-1/assignee', {
      newAssigneeUserId: 'user-3',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(['activities', 'detail', 'act-1']);
  });

  it('propagates 403 and skips invalidation', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.put).mockRejectedValue(new Error('Request failed with status code 403'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReassignActivity(), { wrapper });
    await expect(
      result.current.mutateAsync({
        id: 'act-1',
        request: { newAssigneeUserId: 'user-3' },
      })
    ).rejects.toThrow(/403/);

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useRescheduleActivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PUTs to {id}/due-date and invalidates list + calendar + detail(id)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.put).mockResolvedValue({ data: sampleActivity });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRescheduleActivity(), { wrapper });
    await result.current.mutateAsync({
      id: 'act-1',
      request: { newDueAt: '2026-05-15T10:00:00Z' },
    });

    expect(client.put).toHaveBeenCalledWith('/api/v1/activities/act-1/due-date', {
      newDueAt: '2026-05-15T10:00:00Z',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['activities', 'list'],
      ['activities', 'calendar'],
      ['activities', 'detail', 'act-1'],
    ]);
  });
});

describe('cache layers stay isolated', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a mutation only invalidates the configured prefixes (no global wipe)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleActivity });

    queryClient.setQueryData(['unrelated'], 'keep-me');
    queryClient.setQueryData(['activities', 'detail', 'other'], 'keep-me-too');

    const { result } = renderHook(() => useCompleteActivity(), { wrapper });
    await result.current.mutateAsync({
      id: 'act-1',
      request: { completedAt: '2026-05-09T15:00:00Z' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(['unrelated'])).toBe('keep-me');
    expect(queryClient.getQueryData(['activities', 'detail', 'other'])).toBe('keep-me-too');
  });
});
