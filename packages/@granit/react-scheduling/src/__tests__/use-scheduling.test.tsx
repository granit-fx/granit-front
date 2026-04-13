import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCancelScheduledAction,
  useRescheduleScheduledAction,
  useScheduledAction,
  useScheduledActions,
} from '../hooks/use-scheduling.js';
import { SchedulingProvider } from '../providers/scheduling-provider.js';

import type { SchedulingConfig } from '../providers/scheduling-provider.js';
import type { PagedResult } from '@granit/query-engine';
import type { ScheduledActionResponse } from '@granit/scheduling';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleAction: ScheduledActionResponse = {
  id: 'action-1',
  payloadType: 'SendEmail',
  executeAt: '2026-04-05T09:00:00Z',
  correlationId: null,
  status: 0,
  executedAt: null,
  cancelledBy: null,
  failureReason: null,
  createdAt: '2026-04-02T14:30:00Z',
};

const samplePagedResult: PagedResult<ScheduledActionResponse> = {
  items: [sampleAction],
  totalCount: 1,
  page: 1,
  pageSize: 20,
  nextCursor: undefined,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: SchedulingConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <SchedulingProvider config={config}>{children}</SchedulingProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-scheduling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useScheduledActions', () => {
    it('fetches scheduled actions with default basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: samplePagedResult });

      const { result } = renderHook(() => useScheduledActions(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalled();
      expect(result.current.data).toEqual(samplePagedResult);
    });

    it('fetches scheduled actions with custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: samplePagedResult });

      const { result } = renderHook(() => useScheduledActions(), {
        wrapper: createWrapper(client, '/custom/scheduling'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalled();
    });
  });

  describe('useScheduledAction', () => {
    it('fetches a single scheduled action by ID', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleAction });

      const { result } = renderHook(() => useScheduledAction('action-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(sampleAction);
    });

    it('is disabled when id is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useScheduledAction(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCancelScheduledAction', () => {
    it('cancels a scheduled action via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useCancelScheduledAction(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('action-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalled();
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Not Found'));

      const { result } = renderHook(() => useCancelScheduledAction(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('action-1');

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not Found');
    });
  });

  describe('useRescheduleScheduledAction', () => {
    it('reschedules a scheduled action via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleAction });

      const { result } = renderHook(() => useRescheduleScheduledAction(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        id: 'action-1',
        request: { newExecuteAt: '2026-04-10T09:00:00Z' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalled();
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockRejectedValue(new Error('Conflict'));

      const { result } = renderHook(() => useRescheduleScheduledAction(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        id: 'action-1',
        request: { newExecuteAt: '2026-04-10T09:00:00Z' },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Conflict');
    });
  });
});
