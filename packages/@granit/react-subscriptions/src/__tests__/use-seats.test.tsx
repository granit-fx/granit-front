import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAssignSeat, useRevokeSeat, useSeats } from '../hooks/use-seats.js';
import { SubscriptionsProvider } from '../providers/subscriptions-provider.js';

import type { SubscriptionsConfig } from '../providers/subscriptions-provider.js';
import type { SeatResponse } from '@granit/subscriptions';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleSeat: SeatResponse = {
  id: 'seat-1',
  userId: 'user-1',
  assignedAt: '2026-01-15T10:00:00Z',
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: SubscriptionsConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <SubscriptionsProvider config={config}>{children}</SubscriptionsProvider>
    );
  };
}

describe('use-seats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSeats', () => {
    it('fetches seats for a subscription', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleSeat] });

      const { result } = renderHook(() => useSeats('sub-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith(
        '/api/granit/subscriptions/subscriptions/sub-1/seats'
      );
      expect(result.current.data).toEqual([sampleSeat]);
    });

    it('is disabled when subscriptionId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useSeats(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useAssignSeat', () => {
    it('assigns a seat via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSeat });

      const { result } = renderHook(() => useAssignSeat('sub-1'), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: 'user-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/subscriptions/subscriptions/sub-1/seats',
        { userId: 'user-1' }
      );
      expect(result.current.data).toEqual(sampleSeat);
    });
  });

  describe('useRevokeSeat', () => {
    it('revokes a seat via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRevokeSeat('sub-1'), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: 'user-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(
        '/api/granit/subscriptions/subscriptions/sub-1/seats/user-1'
      );
    });

    it('uses custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRevokeSeat('sub-1'), {
        wrapper: createWrapper(client, '/custom/path'),
      });

      result.current.mutate({ userId: 'user-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/custom/path/subscriptions/sub-1/seats/user-1');
    });
  });
});
