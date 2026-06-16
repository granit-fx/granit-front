import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useActivities, useActivitiesCalendar, useActivity } from '../hooks/use-activities';
import { ActivitiesProvider } from '../providers/activities-provider';

import type {
  ActivityCalendarItemResponse,
  ActivityListResponse,
  ActivityResponse,
} from '@granit/activities';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const sampleActivity: ActivityResponse = {
  id: 'act-1',
  entityType: 'Quote',
  entityId: 'quote-1',
  type: 'FollowUp',
  assignedToUserId: 'user-1',
  createdByUserId: 'user-2',
  dueAt: toISODateString('2026-05-10T10:00:00Z'),
  description: null,
  status: 'Open',
  completedAt: null,
  completedByUserId: null,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
};

const sampleListResponse: ActivityListResponse = {
  items: [sampleActivity],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

const sampleCalendarItem: ActivityCalendarItemResponse = {
  id: 'act-1',
  start: toISODateString('2026-05-10T10:00:00Z'),
  end: null,
  title: 'Quote · FollowUp',
  color: 'open',
  type: 'FollowUp',
  status: 'Open',
  entityType: 'Quote',
  entityId: 'quote-1',
  assignedToUserId: 'user-1',
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <ActivitiesProvider config={{ client, basePath }}>{children}</ActivitiesProvider>
    );
  };
}

describe('useActivities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs the default base path and returns the paginated payload', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleListResponse });

    const { result } = renderHook(() => useActivities(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities', undefined);
    expect(result.current.data).toEqual(sampleListResponse);
  });

  it('forwards filters as query params (only defined axes)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleListResponse });

    const { result } = renderHook(
      () =>
        useActivities({
          status: 'OpenOrOverdue',
          assignedToUserId: 'user-1',
          page: 2,
          pageSize: 50,
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities', {
      params: {
        status: 'OpenOrOverdue',
        assignedToUserId: 'user-1',
        page: 2,
        pageSize: 50,
      },
    });
  });

  it('respects a custom basePath from the provider', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleListResponse });

    const { result } = renderHook(() => useActivities(), {
      wrapper: createWrapper(client, '/custom/activities'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/activities', undefined);
  });
});

describe('useActivity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs the activity by id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleActivity });

    const { result } = renderHook(() => useActivity('act-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities/act-1');
    expect(result.current.data).toEqual(sampleActivity);
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleActivity });

    const { result } = renderHook(() => useActivity(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useActivitiesCalendar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /calendar with the time window and optional filters', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleCalendarItem] });

    const { result } = renderHook(
      () =>
        useActivitiesCalendar({
          from: toISODateString('2026-05-01T00:00:00Z'),
          to: toISODateString('2026-05-31T23:59:59Z'),
          assignee: 'me',
          status: 'OpenOrOverdue',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities/calendar', {
      params: {
        from: toISODateString('2026-05-01T00:00:00Z'),
        to: toISODateString('2026-05-31T23:59:59Z'),
        assignee: 'me',
        status: 'OpenOrOverdue',
      },
    });
    expect(result.current.data).toEqual([sampleCalendarItem]);
  });
});
