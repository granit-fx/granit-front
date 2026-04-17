import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  archivePlan,
  assignSeat,
  bulkMigrateSubscriptionPrice,
  cancelSubscription,
  changeSubscriptionPlan,
  createPlan,
  createPriceVersion,
  createSubscription,
  getActiveSubscription,
  getPlanById,
  getPlanPriceHistory,
  getSubscriptionById,
  listPlans,
  listSeats,
  listSubscriptions,
  migrateSubscriptionPrice,
  publishPlan,
  revokeSeat,
  updatePlan,
} from '../api/subscriptions-api.js';

import type {
  BulkMigratePriceResponse,
  PlanPriceResponse,
  PlanResponse,
  SeatResponse,
  SubscriptionResponse,
} from '../types.js';
import type { PagedResult } from '@granit/query-engine';

const basePath = '/api/granit/subscriptions';

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
  isCurrent: true,
  replacedByPriceId: null,
  replacedAt: null,
};

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

const sampleSeat: SeatResponse = {
  id: 'seat-1',
  userId: 'user-1',
  assignedAt: '2026-01-15T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

describe('subscriptions-api — Plans', () => {
  describe('listPlans', () => {
    it('should GET {basePath}/plans', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([samplePlan]));

      const result = await listPlans(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/plans`);
      expect(result).toEqual([samplePlan]);
    });
  });

  describe('getPlanById', () => {
    it('should GET {basePath}/plans/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(samplePlan));

      const result = await getPlanById(client, basePath, 'plan-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/plans/plan-1`);
      expect(result).toEqual(samplePlan);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(samplePlan));

      await getPlanById(client, basePath, 'plan/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/plans/${encodeURIComponent('plan/special@id')}`
      );
    });
  });

  describe('createPlan', () => {
    it('should POST {basePath}/plans', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(samplePlan));

      const request = {
        name: 'Pro',
        description: 'Professional plan',
        pricingModel: 'PerSeat' as const,
        defaultInterval: 'Monthly' as const,
        trialDays: 14,
        seatLimit: 50,
      };

      const result = await createPlan(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/plans`, request);
      expect(result).toEqual(samplePlan);
    });
  });

  describe('updatePlan', () => {
    it('should PUT {basePath}/plans/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(samplePlan));

      const request = { name: 'Pro Updated', description: null, sortOrder: 2 };

      const result = await updatePlan(client, basePath, 'plan-1', request);

      expect(client.put).toHaveBeenCalledWith(`${basePath}/plans/plan-1`, request);
      expect(result).toEqual(samplePlan);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(samplePlan));

      await updatePlan(client, basePath, 'plan/special@id', {
        name: 'X',
        description: null,
        sortOrder: 0,
      });

      expect(client.put).toHaveBeenCalledWith(
        `${basePath}/plans/${encodeURIComponent('plan/special@id')}`,
        expect.any(Object)
      );
    });
  });

  describe('publishPlan', () => {
    it('should POST {basePath}/plans/{id}/publish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await publishPlan(client, basePath, 'plan-1');

      expect(client.post).toHaveBeenCalledWith(`${basePath}/plans/plan-1/publish`);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await publishPlan(client, basePath, 'plan/special@id');

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/plans/${encodeURIComponent('plan/special@id')}/publish`
      );
    });
  });

  describe('archivePlan', () => {
    it('should POST {basePath}/plans/{id}/archive', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await archivePlan(client, basePath, 'plan-1');

      expect(client.post).toHaveBeenCalledWith(`${basePath}/plans/plan-1/archive`);
    });
  });

  describe('createPriceVersion', () => {
    it('should POST {basePath}/plans/{planId}/prices', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(samplePrice));

      const request = { amount: 29.99, currency: 'EUR', interval: 'Monthly' as const };

      const result = await createPriceVersion(client, basePath, 'plan-1', request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/plans/plan-1/prices`, request);
      expect(result).toEqual(samplePrice);
    });

    it('should encode planId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(samplePrice));

      await createPriceVersion(client, basePath, 'plan/special@id', {
        amount: 10,
        currency: 'USD',
        interval: 'Annual' as const,
      });

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/plans/${encodeURIComponent('plan/special@id')}/prices`,
        expect.any(Object)
      );
    });
  });

  describe('getPlanPriceHistory', () => {
    it('should GET {basePath}/plans/{planId}/prices/history', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([samplePrice]));

      const result = await getPlanPriceHistory(client, basePath, 'plan-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/plans/plan-1/prices/history`);
      expect(result).toEqual([samplePrice]);
    });
  });
});

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

describe('subscriptions-api — Subscriptions', () => {
  describe('listSubscriptions', () => {
    it('should GET {basePath}/subscriptions and return PagedResult', async () => {
      const client = createMockClient();
      const pagedResponse: PagedResult<SubscriptionResponse> = {
        items: [sampleSubscription],
        totalCount: 1,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(pagedResponse));

      const result = await listSubscriptions(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/subscriptions`);
      expect(result.items).toEqual([sampleSubscription]);
      expect(result.totalCount).toBe(1);
    });

    it('should forward query params', async () => {
      const client = createMockClient();
      const pagedResponse: PagedResult<SubscriptionResponse> = {
        items: [sampleSubscription],
        totalCount: 1,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(pagedResponse));

      await listSubscriptions(client, basePath, { page: 2, pageSize: 10 });

      expect(client.get).toHaveBeenCalledWith(
        expect.stringContaining(`${basePath}/subscriptions?`)
      );
    });
  });

  describe('getActiveSubscription', () => {
    it('should GET {basePath}/subscriptions/active', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleSubscription));

      const result = await getActiveSubscription(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/subscriptions/active`);
      expect(result).toEqual(sampleSubscription);
    });
  });

  describe('getSubscriptionById', () => {
    it('should GET {basePath}/subscriptions/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleSubscription));

      const result = await getSubscriptionById(client, basePath, 'sub-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/subscriptions/sub-1`);
      expect(result).toEqual(sampleSubscription);
    });

    it('should encode id with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleSubscription));

      await getSubscriptionById(client, basePath, 'sub/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/subscriptions/${encodeURIComponent('sub/special@id')}`
      );
    });
  });

  describe('createSubscription', () => {
    it('should POST {basePath}/subscriptions', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleSubscription));

      const request = { planId: 'plan-1', currency: 'EUR', trialEndsAt: null };

      const result = await createSubscription(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/subscriptions`, request);
      expect(result).toEqual(sampleSubscription);
    });
  });

  describe('cancelSubscription', () => {
    it('should POST {basePath}/subscriptions/{id}/cancel', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleSubscription));

      const request = { reason: 'Too expensive', atPeriodEnd: true };

      const result = await cancelSubscription(client, basePath, 'sub-1', request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/subscriptions/sub-1/cancel`, request);
      expect(result).toEqual(sampleSubscription);
    });
  });

  describe('changeSubscriptionPlan', () => {
    it('should POST {basePath}/subscriptions/{id}/change-plan', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleSubscription));

      const request = { newPlanId: 'plan-2' };

      const result = await changeSubscriptionPlan(client, basePath, 'sub-1', request);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/subscriptions/sub-1/change-plan`,
        request
      );
      expect(result).toEqual(sampleSubscription);
    });
  });

  describe('migrateSubscriptionPrice', () => {
    it('should POST {basePath}/subscriptions/{id}/migrate-price', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleSubscription));

      const request = { newPlanPriceId: 'price-2' };

      const result = await migrateSubscriptionPrice(client, basePath, 'sub-1', request);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/subscriptions/sub-1/migrate-price`,
        request
      );
      expect(result).toEqual(sampleSubscription);
    });
  });

  describe('bulkMigrateSubscriptionPrice', () => {
    it('should POST {basePath}/subscriptions/bulk-migrate-price', async () => {
      const client = createMockClient();
      const bulkResponse: BulkMigratePriceResponse = { migratedCount: 42 };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(bulkResponse));

      const request = {
        planId: 'plan-1',
        newPlanPriceId: 'price-2',
        oldPlanPriceId: 'price-1',
      };

      const result = await bulkMigrateSubscriptionPrice(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith(
        `${basePath}/subscriptions/bulk-migrate-price`,
        request
      );
      expect(result).toEqual(bulkResponse);
    });
  });
});

// ---------------------------------------------------------------------------
// Seats
// ---------------------------------------------------------------------------

describe('subscriptions-api — Seats', () => {
  describe('listSeats', () => {
    it('should GET {basePath}/subscriptions/{subscriptionId}/seats', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleSeat]));

      const result = await listSeats(client, basePath, 'sub-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/subscriptions/sub-1/seats`);
      expect(result).toEqual([sampleSeat]);
    });

    it('should encode subscriptionId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await listSeats(client, basePath, 'sub/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/subscriptions/${encodeURIComponent('sub/special@id')}/seats`
      );
    });
  });

  describe('assignSeat', () => {
    it('should POST {basePath}/subscriptions/{subscriptionId}/seats', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleSeat));

      const request = { userId: 'user-1' };

      const result = await assignSeat(client, basePath, 'sub-1', request);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/subscriptions/sub-1/seats`, request);
      expect(result).toEqual(sampleSeat);
    });
  });

  describe('revokeSeat', () => {
    it('should DELETE {basePath}/subscriptions/{subscriptionId}/seats/{userId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await revokeSeat(client, basePath, 'sub-1', 'user-1');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/subscriptions/sub-1/seats/user-1`);
    });

    it('should encode subscriptionId and userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await revokeSeat(client, basePath, 'sub/special@id', 'user/special@id');

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/subscriptions/${encodeURIComponent('sub/special@id')}/seats/${encodeURIComponent('user/special@id')}`
      );
    });
  });
});
