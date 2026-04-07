import {
  applyFilter,
  groupBy as groupByField,
  paginate,
  parseFilters,
  parseSort,
  sortItems,
} from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { WebhookSubscriptionStatus } from '@granit/webhooks';
import { http, HttpResponse } from 'msw';

import {
  mockWebhookConfig,
  mockWebhookDeliveryAttempts,
  mockWebhookStats,
  mockWebhookSubscriptions,
} from './data.js';

import type { WebhookSubscriptionResponse } from '@granit/webhooks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyPresets(
  items: WebhookSubscriptionResponse[],
  url: URL
): WebhookSubscriptionResponse[] {
  const statusPresets = url.searchParams.get('presets[status]');
  if (statusPresets) {
    const statuses = statusPresets.split(',').map((s) => s.toLowerCase());
    const statusMap: Record<string, number> = {
      active: WebhookSubscriptionStatus.Active,
      suspended: WebhookSubscriptionStatus.Suspended,
      deactivated: WebhookSubscriptionStatus.Deactivated,
    };
    const allowedStatuses = statuses.map((s) => statusMap[s]).filter((v) => v !== undefined);
    if (allowedStatuses.length > 0) {
      items = items.filter((s) => allowedStatuses.includes(s.status));
    }
  }
  return items;
}

function applyQuickFilters(
  items: WebhookSubscriptionResponse[],
  url: URL
): WebhookSubscriptionResponse[] {
  const qf = url.searchParams.get('quickFilters');
  if (qf?.includes('hasFailures')) {
    items = items.filter((s) => s.consecutiveFailureCount > 0);
  }
  return items;
}

function generateSecret(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Create stateful MSW handlers for webhook subscription and delivery endpoints.
 * Mutations (create, update, delete, activate, suspend, deactivate) persist
 * in the module-level subscriptions array.
 *
 * @param baseUrl - API base path (default: `/api/v1/webhooks`)
 */
export function createWebhooksHandlers(baseUrl = '/api/v1/webhooks') {
  let subscriptions = [...mockWebhookSubscriptions];
  const deliveryAttempts = [...mockWebhookDeliveryAttempts];

  return [
    // -------------------------------------------------------------------------
    // Static routes MUST come before parameterized routes
    // -------------------------------------------------------------------------

    // Config
    http.get(`${baseUrl}/config`, () => {
      return HttpResponse.json(mockWebhookConfig);
    }),

    // Stats
    http.get(`${baseUrl}/subscriptions/stats`, () => {
      return HttpResponse.json(mockWebhookStats);
    }),

    // Event types
    http.get(`${baseUrl}/event-types`, () => {
      return HttpResponse.json([
        {
          eventType: 'user.created',
          displayName: 'User created',
          description: 'Fired when a new user is created.',
          category: 'Identity',
        },
        {
          eventType: 'user.updated',
          displayName: 'User updated',
          description: 'Fired when a user profile is updated.',
          category: 'Identity',
        },
        {
          eventType: 'user.deleted',
          displayName: 'User deleted',
          description: 'Fired when a user is removed.',
          category: 'Identity',
        },
        {
          eventType: 'document.uploaded',
          displayName: 'Document uploaded',
          description: 'Fired when a document is uploaded.',
          category: 'Documents',
        },
        {
          eventType: 'document.approved',
          displayName: 'Document approved',
          description: 'Fired when a document is approved.',
          category: 'Documents',
        },
        {
          eventType: 'workflow.transitioned',
          displayName: 'Workflow transitioned',
          description: 'Fired when an entity changes workflow state.',
          category: 'Workflow',
        },
        {
          eventType: 'settings.changed',
          displayName: 'Settings changed',
          description: 'Fired when an application setting is modified.',
          category: 'Configuration',
        },
      ]);
    }),

    // Subscriptions list (Granit.QueryEngine)
    http.get(`${baseUrl}/subscriptions`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search');
      const filters = parseFilters(url);
      const sortEntries = parseSort(url);

      let filtered = [...subscriptions];

      // Full-text search
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (s) => s.targetUrl.toLowerCase().includes(q) || s.eventType.toLowerCase().includes(q)
        );
      }

      // Filters
      for (const f of filters) {
        filtered = filtered.filter((s) => applyFilter(s as unknown as Record<string, unknown>, f));
      }

      // Presets
      filtered = applyPresets(filtered, url);

      // Quick filters
      filtered = applyQuickFilters(filtered, url);

      // Sort
      filtered = sortItems(
        filtered as unknown as Record<string, unknown>[],
        sortEntries,
        'createdAt'
      ) as unknown as WebhookSubscriptionResponse[];

      // GroupBy
      const groupByParam = url.searchParams.get('groupBy');
      if (groupByParam) {
        return HttpResponse.json(
          groupByField(filtered as unknown as Record<string, unknown>[], groupByParam)
        );
      }

      return HttpResponse.json(paginate(filtered, url));
    }),

    // Create subscription
    http.post(`${baseUrl}/subscriptions`, async ({ request }) => {
      const body = (await request.json()) as {
        targetUrl: string;
        eventType: string;
      };
      const now = toISODateString(new Date().toISOString());
      const newSub: WebhookSubscriptionResponse = {
        id: toEntityId<'WebhookSubscription'>(`ws-${Date.now()}`),
        targetUrl: body.targetUrl,
        eventType: body.eventType,
        status: WebhookSubscriptionStatus.Active,
        consecutiveFailureCount: 0,
        lastSuccessAt: null,
        createdAt: now,
        modifiedAt: now,
      };
      subscriptions.push(newSub);
      return HttpResponse.json(newSub, { status: 201 });
    }),

    // -------------------------------------------------------------------------
    // Delivery meta (before :id catch-all)
    // -------------------------------------------------------------------------

    http.get(`${baseUrl}/subscriptions/:id/deliveries`, ({ params, request }) => {
      const subscriptionId = params.id as string;
      const url = new URL(request.url);
      const filters = parseFilters(url);
      const sortEntries = parseSort(url);

      let filtered = deliveryAttempts.filter((d) => d.subscriptionId === subscriptionId);

      // Presets
      const resultPresets = url.searchParams.get('presets[result]');
      if (resultPresets) {
        const presets = new Set(resultPresets.split(','));
        if (presets.has('success') && !presets.has('failure')) {
          filtered = filtered.filter((d) => d.isSuccess);
        } else if (presets.has('failure') && !presets.has('success')) {
          filtered = filtered.filter((d) => !d.isSuccess);
        }
      }

      // Quick filters
      const qf = url.searchParams.get('quickFilters');
      if (qf?.includes('hasError')) {
        filtered = filtered.filter((d) => d.errorMessage !== null);
      }

      // Filters
      for (const f of filters) {
        filtered = filtered.filter((d) => applyFilter(d as unknown as Record<string, unknown>, f));
      }

      // Sort
      filtered = sortItems(
        filtered as unknown as Record<string, unknown>[],
        sortEntries,
        '-occurredAt'
      ) as unknown as typeof filtered;

      // GroupBy
      const groupByParam = url.searchParams.get('groupBy');
      if (groupByParam) {
        return HttpResponse.json(
          groupByField(filtered as unknown as Record<string, unknown>[], groupByParam)
        );
      }

      return HttpResponse.json(paginate(filtered, url));
    }),

    // Retry delivery
    http.post(`${baseUrl}/deliveries/:deliveryId/retry`, ({ params }) => {
      const deliveryId = params.deliveryId as string;
      const original = deliveryAttempts.find((d) => d.deliveryId === deliveryId);
      if (!original) {
        return new HttpResponse(null, { status: 404 });
      }
      if (original.isSuccess) {
        return HttpResponse.json({ error: 'Cannot retry a successful delivery' }, { status: 400 });
      }
      const now = toISODateString(new Date().toISOString());
      const retry = {
        ...original,
        deliveryId: toEntityId<'WebhookDelivery'>(`del-retry-${Date.now()}`),
        occurredAt: now,
        httpStatusCode: 200,
        durationMs: 150,
        errorMessage: null,
        isSuccess: true,
      };
      deliveryAttempts.push(retry);
      return HttpResponse.json(retry, { status: 201 });
    }),

    // -------------------------------------------------------------------------
    // Parameterized :id routes
    // -------------------------------------------------------------------------

    // Get single subscription
    http.get(`${baseUrl}/subscriptions/:id`, ({ params }) => {
      const id = params.id as string;
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(sub);
    }),

    // Update subscription
    http.put(`${baseUrl}/subscriptions/:id`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as Partial<WebhookSubscriptionResponse>;
      const idx = subscriptions.findIndex((s) => s.id === id);
      const existing = subscriptions[idx];
      if (idx === -1 || !existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: WebhookSubscriptionResponse = {
        ...existing,
        targetUrl: body.targetUrl ?? existing.targetUrl,
        eventType: body.eventType ?? existing.eventType,
        modifiedAt: toISODateString(new Date().toISOString()),
      };
      subscriptions[idx] = updated;
      return HttpResponse.json(updated);
    }),

    // Delete subscription
    http.delete(`${baseUrl}/subscriptions/:id`, ({ params }) => {
      const id = params.id as string;
      const idx = subscriptions.findIndex((s) => s.id === id);
      if (idx === -1) {
        return new HttpResponse(null, { status: 404 });
      }
      subscriptions = subscriptions.filter((s) => s.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),

    // Activate
    http.post(`${baseUrl}/subscriptions/:id/activate`, ({ params }) => {
      const id = params.id as string;
      const idx = subscriptions.findIndex((s) => s.id === id);
      const existing = subscriptions[idx];
      if (idx === -1 || !existing) return new HttpResponse(null, { status: 404 });
      if (existing.status !== WebhookSubscriptionStatus.Suspended) {
        return HttpResponse.json(
          { error: 'Can only activate a suspended subscription' },
          { status: 409 }
        );
      }
      const updated: WebhookSubscriptionResponse = {
        ...existing,
        status: WebhookSubscriptionStatus.Active,
        consecutiveFailureCount: 0,
        modifiedAt: toISODateString(new Date().toISOString()),
      };
      subscriptions[idx] = updated;
      return HttpResponse.json(updated);
    }),

    // Suspend
    http.post(`${baseUrl}/subscriptions/:id/suspend`, ({ params }) => {
      const id = params.id as string;
      const idx = subscriptions.findIndex((s) => s.id === id);
      const existing = subscriptions[idx];
      if (idx === -1 || !existing) return new HttpResponse(null, { status: 404 });
      if (existing.status !== WebhookSubscriptionStatus.Active) {
        return HttpResponse.json(
          { error: 'Can only suspend an active subscription' },
          { status: 409 }
        );
      }
      const updated: WebhookSubscriptionResponse = {
        ...existing,
        status: WebhookSubscriptionStatus.Suspended,
        modifiedAt: toISODateString(new Date().toISOString()),
      };
      subscriptions[idx] = updated;
      return HttpResponse.json(updated);
    }),

    // Deactivate
    http.post(`${baseUrl}/subscriptions/:id/deactivate`, async ({ params, request }) => {
      const id = params.id as string;
      await request.json(); // consume body (reason)
      const idx = subscriptions.findIndex((s) => s.id === id);
      const existing = subscriptions[idx];
      if (idx === -1 || !existing) return new HttpResponse(null, { status: 404 });
      if (existing.status === WebhookSubscriptionStatus.Deactivated) {
        return HttpResponse.json({ error: 'Subscription is already deactivated' }, { status: 409 });
      }
      const updated: WebhookSubscriptionResponse = {
        ...existing,
        status: WebhookSubscriptionStatus.Deactivated,
        modifiedAt: toISODateString(new Date().toISOString()),
      };
      subscriptions[idx] = updated;
      return HttpResponse.json(updated);
    }),

    // Rotate secret
    http.post(`${baseUrl}/subscriptions/:id/rotate-secret`, ({ params }) => {
      const id = params.id as string;
      const idx = subscriptions.findIndex((s) => s.id === id);
      const existing = subscriptions[idx];
      if (idx === -1 || !existing) return new HttpResponse(null, { status: 404 });
      const newSecret = generateSecret();
      subscriptions[idx] = {
        ...existing,
        modifiedAt: toISODateString(new Date().toISOString()),
      };
      return HttpResponse.json({ signingSecret: newSecret });
    }),

    // Test ping
    http.post(`${baseUrl}/subscriptions/:id/test-ping`, ({ params }) => {
      const id = params.id as string;
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json({
        success: true,
        httpStatusCode: 200,
        durationMs: Math.floor(Math.random() * 300) + 50,
      });
    }),
  ];
}
