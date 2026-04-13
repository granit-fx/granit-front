import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useArchivePlan,
  useCreatePlan,
  useCreatePriceVersion,
  usePlan,
  usePlanPriceHistory,
  usePlans,
  usePublishPlan,
  useUpdatePlan,
} from '../hooks/use-plans.js';
import { SubscriptionsProvider } from '../providers/subscriptions-provider.js';

import type { SubscriptionsConfig } from '../providers/subscriptions-provider.js';
import type { PlanPriceResponse, PlanResponse } from '@granit/subscriptions';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const samplePlan: PlanResponse = {
  id: 'plan-1',
  name: 'Pro',
  description: 'Professional plan',
  pricingModel: 'PerSeat',
  defaultInterval: 'Monthly',
  trialDays: 14,
  seatLimit: 50,
  sortOrder: 1,
  lifecycleStatus: 'Draft',
  prices: [],
};

const samplePrice: PlanPriceResponse = {
  id: 'price-1',
  amount: 29.99,
  currency: 'EUR',
  interval: 'Monthly',
  effectiveFrom: '2026-01-01T00:00:00Z',
  isActive: true,
  replacedByPriceId: null,
  replacedAt: null,
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

describe('use-plans', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePlans', () => {
    it('fetches all plans', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [samplePlan] });

      const { result } = renderHook(() => usePlans(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/subscriptions/plans');
      expect(result.current.data).toEqual([samplePlan]);
    });
  });

  describe('usePlan', () => {
    it('fetches a plan by id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: samplePlan });

      const { result } = renderHook(() => usePlan('plan-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/subscriptions/plans/plan-1');
      expect(result.current.data).toEqual(samplePlan);
    });

    it('is disabled when id is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => usePlan(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreatePlan', () => {
    it('creates a plan via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: samplePlan });

      const { result } = renderHook(() => useCreatePlan(), {
        wrapper: createWrapper(client),
      });

      const request = {
        name: 'Pro',
        description: 'Professional plan',
        pricingModel: 'PerSeat' as const,
        defaultInterval: 'Monthly' as const,
        trialDays: 14,
        seatLimit: 50,
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/subscriptions/plans', request);
    });
  });

  describe('useUpdatePlan', () => {
    it('updates a plan via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: samplePlan });

      const { result } = renderHook(() => useUpdatePlan(), {
        wrapper: createWrapper(client),
      });

      const request = { name: 'Pro Updated', description: null, sortOrder: 2 };
      result.current.mutate({ id: 'plan-1', request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith('/api/v1/subscriptions/plans/plan-1', request);
    });
  });

  describe('usePublishPlan', () => {
    it('publishes a plan via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => usePublishPlan(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: 'plan-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/subscriptions/plans/plan-1/publish');
    });
  });

  describe('useArchivePlan', () => {
    it('archives a plan via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useArchivePlan(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ id: 'plan-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith('/api/v1/subscriptions/plans/plan-1/archive');
    });
  });

  describe('useCreatePriceVersion', () => {
    it('creates a price version via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: samplePrice });

      const { result } = renderHook(() => useCreatePriceVersion(), {
        wrapper: createWrapper(client),
      });

      const request = { amount: 29.99, currency: 'EUR', interval: 'Monthly' as const };
      result.current.mutate({ planId: 'plan-1', request });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/subscriptions/plans/plan-1/prices',
        request
      );
    });
  });

  describe('usePlanPriceHistory', () => {
    it('fetches price history for a plan', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [samplePrice] });

      const { result } = renderHook(() => usePlanPriceHistory('plan-1'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/subscriptions/plans/plan-1/prices/history');
      expect(result.current.data).toEqual([samplePrice]);
    });

    it('is disabled when planId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => usePlanPriceHistory(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('custom basePath', () => {
    it('uses custom basePath when provided', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [samplePlan] });

      const { result } = renderHook(() => usePlans(), {
        wrapper: createWrapper(client, '/custom/path'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/path/plans');
    });
  });
});
