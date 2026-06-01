import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockPlans, mockPriceHistory, mockSeats, mockSubscriptions } from './data';

import type { QueryMetadata } from '@granit/query-engine';
import type {
  PlanCreateRequest,
  PlanPriceResponse,
  SeatResponse,
  SubscriptionResponse,
} from '@granit/subscriptions';
import type { CurrencyCode } from '@granit/types';

const PRICING_MODELS = ['Flat', 'PerSeat', 'Tiered', 'UsageBased'];
const BILLING_INTERVALS = ['Monthly', 'Quarterly', 'SemiAnnual', 'Annual'];
const PLAN_LIFECYCLE_STATES = ['Draft', 'Published', 'Archived'];
const SUBSCRIPTION_STATES = ['Active', 'Trial', 'PastDue', 'Canceled', 'Expired'];

/** Mock /meta payload for the plans resource. */
export const planQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'String',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'pricingModel',
      label: 'Pricing model',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'defaultInterval',
      label: 'Interval',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'trialDays',
      label: 'Trial days',
      type: 'Int32',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'seatLimit',
      label: 'Seat limit',
      type: 'Int32',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'sortOrder',
      label: 'Sort order',
      type: 'Int32',
      order: 7,
      isSortable: true,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'lifecycleStatus',
      label: 'Status',
      type: 'String',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'description', type: 'String', operators: STRING_OPERATORS },
    { name: 'pricingModel', type: 'String', operators: ENUM_OPERATORS, enumValues: PRICING_MODELS },
    {
      name: 'defaultInterval',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: BILLING_INTERVALS,
    },
    { name: 'trialDays', type: 'Int32', operators: NUMBER_OPERATORS },
    { name: 'seatLimit', type: 'Int32', operators: NUMBER_OPERATORS },
    {
      name: 'lifecycleStatus',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: PLAN_LIFECYCLE_STATES,
    },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'pricingModel' },
    { name: 'defaultInterval' },
    { name: 'trialDays' },
    { name: 'seatLimit' },
    { name: 'sortOrder' },
    { name: 'lifecycleStatus' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'published', label: 'Published', isDefault: true },
    { name: 'draft', label: 'Drafts', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'lifecycleStatus', type: 'String' },
    { name: 'pricingModel', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'sortOrder',
};

/** Mock /meta payload for the subscriptions resource. */
export const subscriptionQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'planId',
      label: 'Plan',
      type: 'Guid',
      order: 1,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currentPeriodStart',
      label: 'Period start',
      type: 'DateTime',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currentPeriodEnd',
      label: 'Period end',
      type: 'DateTime',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'trialEndsAt',
      label: 'Trial ends',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'cancelAtPeriodEnd',
      label: 'Cancel at period end',
      type: 'Boolean',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'cancelledAt',
      label: 'Cancelled at',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'dunningAttempt',
      label: 'Dunning attempt',
      type: 'Int32',
      order: 9,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'seatCount',
      label: 'Seats',
      type: 'Int32',
      order: 10,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'planId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: SUBSCRIPTION_STATES },
    { name: 'currency', type: 'String', operators: ENUM_OPERATORS },
    { name: 'currentPeriodStart', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'currentPeriodEnd', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'trialEndsAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'cancelAtPeriodEnd', type: 'Boolean', operators: ENUM_OPERATORS },
    { name: 'cancelledAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'dunningAttempt', type: 'Int32', operators: NUMBER_OPERATORS },
    { name: 'seatCount', type: 'Int32', operators: NUMBER_OPERATORS },
  ],
  sortableFields: [
    { name: 'status' },
    { name: 'currency' },
    { name: 'currentPeriodStart' },
    { name: 'currentPeriodEnd' },
    { name: 'trialEndsAt' },
    { name: 'cancelledAt' },
    { name: 'seatCount' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: true },
    { name: 'trial', label: 'Trial', isDefault: false },
    { name: 'pastDue', label: 'Past due', isDefault: false },
    { name: 'canceled', label: 'Canceled', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'currentPeriodEnd',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['ThisWeek', 'ThisMonth', 'LastMonth', 'ThisQuarter', 'ThisYear', 'Custom'],
    },
  ],
  groupByFields: [
    { name: 'status', type: 'String' },
    { name: 'planId', type: 'Guid' },
    { name: 'currency', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-currentPeriodStart',
};

/**
 * Create stateful MSW handlers for subscriptions endpoints.
 * Covers plans, price versions, subscriptions, and seats — all mutations
 * persist in the in-memory data arrays.
 *
 * @param baseUrl - API base path (default: `/api/v1/subscriptions`)
 */
export function createSubscriptionsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /plans/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/plans`, planQueryMetadata),

    // GET /subscriptions/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/subscriptions`, subscriptionQueryMetadata),

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

    http.get(`${baseUrl}/plans/:planId/prices/history`, ({ params }) => {
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
