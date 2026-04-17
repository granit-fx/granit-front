import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { mockPlans, mockPriceHistory, mockSeats, mockSubscriptions } from './data.js';

import type {
  PlanCreateRequest,
  PlanPriceResponse,
  SeatResponse,
  SubscriptionResponse,
} from '@granit/subscriptions';
import type { CurrencyCode } from '@granit/types';

/**
 * Create stateful MSW handlers for subscriptions endpoints.
 * Covers plans, price versions, subscriptions, and seats — all mutations
 * persist in the in-memory data arrays.
 *
 * @param baseUrl - API base path (default: `/api/v1/subscriptions`)
 */
export function createSubscriptionsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // ---------------------------------------------------------------------------
    // Plans
    // ---------------------------------------------------------------------------

    http.get(`${baseUrl}/plans`, () => {
      return HttpResponse.json(mockPlans);
    }),

    http.get(`${baseUrl}/plans/:planId`, ({ params }) => {
      const plan = mockPlans.find((p) => p.id === params.planId);
      if (!plan) return notFound();
      return HttpResponse.json(plan);
    }),

    http.post(`${baseUrl}/plans`, async ({ request }) => {
      const body = (await request.json()) as PlanCreateRequest;
      const newPlan = {
        id: toEntityId<'Plan'>(`plan-${String(mockPlans.length + 1).padStart(3, '0')}`),
        ...body,
        sortOrder: mockPlans.length,
        lifecycleStatus: 'Draft' as const,
        prices: [],
      };
      mockPlans.push(newPlan);
      return HttpResponse.json(newPlan, { status: 201 });
    }),

    http.put(`${baseUrl}/plans/:planId`, async ({ params, request }) => {
      const body = (await request.json()) as Partial<PlanCreateRequest>;
      const plan = mockPlans.find((p) => p.id === params.planId);
      if (!plan) return notFound();
      Object.assign(plan, body);
      return HttpResponse.json(plan);
    }),

    http.post(`${baseUrl}/plans/:planId/publish`, ({ params }) => {
      const plan = mockPlans.find((p) => p.id === params.planId);
      if (!plan) return notFound();
      plan.lifecycleStatus = 'Published';
      return HttpResponse.json(plan);
    }),

    http.post(`${baseUrl}/plans/:planId/archive`, ({ params }) => {
      const plan = mockPlans.find((p) => p.id === params.planId);
      if (!plan) return notFound();
      plan.lifecycleStatus = 'Archived';
      return HttpResponse.json(plan);
    }),

    // ---------------------------------------------------------------------------
    // Price versions
    // ---------------------------------------------------------------------------

    http.get(`${baseUrl}/plans/:planId/prices`, ({ params }) => {
      const prices = mockPriceHistory[params.planId as string] ?? [];
      return HttpResponse.json(prices);
    }),

    http.post(`${baseUrl}/plans/:planId/prices`, async ({ params, request }) => {
      const body = (await request.json()) as {
        amount: number;
        currency: string;
        interval: string;
        effectiveFrom: string;
      };
      const planId = params.planId as string;
      mockPriceHistory[planId] ??= [];
      const existing = mockPriceHistory[planId];
      const newId = toEntityId<'PlanPrice'>(`price-${planId}-${existing.length + 1}`);

      // Mark previous current price as replaced
      for (const price of existing) {
        if (price.isCurrent) {
          price.isCurrent = false;
          price.replacedByPriceId = newId;
          price.replacedAt = toISODateString(new Date().toISOString());
        }
      }

      const newPrice: PlanPriceResponse = {
        id: newId,
        amount: body.amount,
        currency: body.currency as CurrencyCode,
        interval: body.interval,
        effectiveFrom: toISODateString(body.effectiveFrom),
        isCurrent: true,
        replacedByPriceId: null,
        replacedAt: null,
      };
      existing.push(newPrice);
      return HttpResponse.json(newPrice, { status: 201 });
    }),

    // ---------------------------------------------------------------------------
    // Subscriptions
    // ---------------------------------------------------------------------------

    http.get(`${baseUrl}/subscriptions`, () => {
      return HttpResponse.json({
        items: mockSubscriptions,
        totalCount: mockSubscriptions.length,
      });
    }),

    http.get(`${baseUrl}/subscriptions/active`, ({ params: _params }) => {
      const active = mockSubscriptions.find((s) => s.status === 'Active');
      if (!active) return notFound();
      return HttpResponse.json(active);
    }),

    http.get(`${baseUrl}/subscriptions/:subscriptionId`, ({ params }) => {
      const sub = mockSubscriptions.find((s) => s.id === params.subscriptionId);
      if (!sub) return notFound();
      return HttpResponse.json(sub);
    }),

    http.post(`${baseUrl}/subscriptions`, async ({ request }) => {
      const body = (await request.json()) as {
        planId: string;
        currency: string;
        trialEndsAt: string | null;
      };
      const now = toISODateString(new Date().toISOString());
      const newSub: SubscriptionResponse = {
        id: toEntityId<'Subscription'>(
          `sub-${String(mockSubscriptions.length + 1).padStart(3, '0')}`
        ),
        planId: toEntityId<'Plan'>(body.planId),
        status: body.trialEndsAt ? 'Trial' : 'Active',
        currency: body.currency as CurrencyCode,
        currentPeriodStart: now,
        currentPeriodEnd: toISODateString(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
        trialEndsAt: body.trialEndsAt ? toISODateString(body.trialEndsAt) : null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancellationReason: null,
        dunningAttempt: 0,
        seatCount: 0,
        planPriceId: null,
      };
      mockSubscriptions.push(newSub);
      return HttpResponse.json(newSub, { status: 201 });
    }),

    http.post(`${baseUrl}/subscriptions/:subscriptionId/cancel`, ({ params }) => {
      const sub = mockSubscriptions.find((s) => s.id === params.subscriptionId);
      if (!sub) return notFound();
      sub.status = 'Canceled';
      sub.cancelledAt = toISODateString(new Date().toISOString());
      return HttpResponse.json(sub);
    }),

    http.post(
      `${baseUrl}/subscriptions/:subscriptionId/change-plan`,
      async ({ params, request }) => {
        const body = (await request.json()) as { newPlanId: string };
        const sub = mockSubscriptions.find((s) => s.id === params.subscriptionId);
        if (!sub) return notFound();
        sub.planId = toEntityId<'Plan'>(body.newPlanId);
        return HttpResponse.json(sub);
      }
    ),

    http.post(`${baseUrl}/subscriptions/:subscriptionId/migrate-price`, () => {
      return noContent();
    }),

    http.post(`${baseUrl}/subscriptions/bulk-migrate-price`, () => {
      return HttpResponse.json({ migratedCount: 3 });
    }),

    // ---------------------------------------------------------------------------
    // Seats
    // ---------------------------------------------------------------------------

    http.get(`${baseUrl}/subscriptions/:subscriptionId/seats`, ({ params }) => {
      const seats = mockSeats[params.subscriptionId as string] ?? [];
      return HttpResponse.json(seats);
    }),

    http.post(`${baseUrl}/subscriptions/:subscriptionId/seats`, async ({ params, request }) => {
      const body = (await request.json()) as { userId: string };
      const subscriptionId = params.subscriptionId as string;
      mockSeats[subscriptionId] ??= [];
      const newSeat: SeatResponse = {
        id: toEntityId<'Seat'>(
          `seat-${String(mockSeats[subscriptionId].length + 1).padStart(3, '0')}`
        ),
        userId: toEntityId<'User'>(body.userId),
        assignedAt: toISODateString(new Date().toISOString()),
      };
      mockSeats[subscriptionId].push(newSeat);
      return HttpResponse.json(newSeat, { status: 201 });
    }),

    http.delete(`${baseUrl}/subscriptions/:subscriptionId/seats/:seatId`, ({ params }) => {
      const subscriptionId = params.subscriptionId as string;
      const seatId = params.seatId as string;
      if (mockSeats[subscriptionId]) {
        mockSeats[subscriptionId] = mockSeats[subscriptionId].filter((s) => s.id !== seatId);
      }
      return noContent();
    }),
  ];
}
