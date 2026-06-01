import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useActiveSubscription,
  useBulkMigrateSubscriptionPrice,
  useCancelSubscription,
  useChangeSubscriptionPlan,
  useCreateSubscription,
  useMigrateSubscriptionPrice,
  useSubscription,
  useSubscriptions,
} from '../hooks/use-subscriptions';
import { SubscriptionsProvider } from '../providers/subscriptions-provider';

import type { SubscriptionsConfig } from '../providers/subscriptions-provider';
import type { PagedResult } from '@granit/query-engine';
import type { BulkMigratePriceResponse, SubscriptionResponse } from '@granit/subscriptions';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const sampleSubscription: SubscriptionResponse = {
  id: 'sub-1',
  planId: 'plan-1',
  status: 'Active',
  currency: 'EUR',
  currentPeriodStart: '2026-01-01T00:00:00Z',
  currentPeriodEnd: '2026-02-01T00:00:00Z',
  trialEndsAt: null,
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  cancellationReason: null,
  dunningAttempt: 0,
  seatCount: 5,
  planPriceId: 'price-1',
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

describe('use-subscriptions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSubscriptions', () => {
    it('fetches subscriptions as PagedResult', async () => {
      const client = createMockClient();
      const pagedResponse: PagedResult<SubscriptionResponse> = {
        items: [sampleSubscription],
        totalCount: 1,
      };
      vi.mocked(client.get).mockResolvedValue({ data: pagedResponse });

      const { result } = renderHook(() => useSubscriptions(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/subscriptions/subscriptions');
      expect(result.current.data?.items).toEqual([sampleSubscription]);
      expect(result.current.data?.totalCount).toBe(1);
    });
  });

  describe('useActiveSubscription', () => {
    it('fetches the active subscription', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleSubscription });

      const { result } = renderHook(() => useActiveSubscription(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/subscriptions/subscriptions/active');
      expect(result.current.data).toEqual(sampleSubscription);
    });
  });

  describe('useSubscription', () => {
    it('fetches a subscription by id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleSubscription });

      const { result } = renderHook(() => useSubscription('sub-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/subscriptions/subscriptions/sub-1');
    });

    it('is disabled when id is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useSubscription(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateSubscription', () => {
    it('creates a subscription via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSubscription });

      const { result } = renderHook(() => useCreateSubscription(), {
        wrapper: createWrapper(client),
      });

      const request = { planId: 'plan-1', currency: 'EUR', trialEndsAt: null };
      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/subscriptions/subscriptions', request);
    });
  });

  describe('useCancelSubscription', () => {
    it('cancels a subscription via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSubscription });

      const { result } = renderHook(() => useCancelSubscription(), {
        wrapper: createWrapper(client),
      });

      const request = { reason: 'Too expensive', atPeriodEnd: true };
      result.current.mutate({ id: 'sub-1', request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/subscriptions/subscriptions/sub-1/cancel',
        request
      );
    });
  });

  describe('useChangeSubscriptionPlan', () => {
    it('changes plan via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSubscription });

      const { result } = renderHook(() => useChangeSubscriptionPlan(), {
        wrapper: createWrapper(client),
      });

      const request = { newPlanId: 'plan-2' };
      result.current.mutate({ id: 'sub-1', request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/subscriptions/subscriptions/sub-1/change-plan',
        request
      );
    });
  });

  describe('useMigrateSubscriptionPrice', () => {
    it('migrates price via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleSubscription });

      const { result } = renderHook(() => useMigrateSubscriptionPrice(), {
        wrapper: createWrapper(client),
      });

      const request = { newPlanPriceId: 'price-2' };
      result.current.mutate({ id: 'sub-1', request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/subscriptions/subscriptions/sub-1/migrate-price',
        request
      );
    });
  });

  describe('useBulkMigrateSubscriptionPrice', () => {
    it('bulk-migrates prices via POST', async () => {
      const client = createMockClient();
      const bulkResponse: BulkMigratePriceResponse = { migratedCount: 42 };
      vi.mocked(client.post).mockResolvedValue({ data: bulkResponse });

      const { result } = renderHook(() => useBulkMigrateSubscriptionPrice(), {
        wrapper: createWrapper(client),
      });

      const request = {
        planId: 'plan-1',
        newPlanPriceId: 'price-2',
        oldPlanPriceId: 'price-1',
      };
      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/subscriptions/subscriptions/bulk-migrate-price',
        request
      );
      expect(result.current.data).toEqual(bulkResponse);
    });
  });

  describe('custom basePath', () => {
    it('uses custom basePath when provided', async () => {
      const client = createMockClient();
      const pagedResponse: PagedResult<SubscriptionResponse> = {
        items: [sampleSubscription],
        totalCount: 1,
      };
      vi.mocked(client.get).mockResolvedValue({ data: pagedResponse });

      const { result } = renderHook(() => useSubscriptions(), {
        wrapper: createWrapper(client, '/custom/path'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/path/subscriptions');
    });
  });
});
