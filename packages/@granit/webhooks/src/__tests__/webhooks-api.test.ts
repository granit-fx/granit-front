import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  activateSubscription,
  createSubscription,
  deactivateSubscription,
  deleteSubscription,
  getConfig,
  getDeliveries,
  getEventTypes,
  getStats,
  getSubscription,
  retryDelivery,
  rotateSecret,
  suspendSubscription,
  testPing,
  updateSubscription,
} from '../api/webhooks-api';
import { WebhookSubscriptionStatus } from '../types/index';

import type {
  WebhookDeliveryAttemptResponse,
  WebhookEventTypeResponse,
  WebhookModuleConfig,
  WebhookSubscriptionCreatedResponse,
  WebhookSubscriptionResponse,
  WebhookSubscriptionRotateSecretResponse,
  WebhookSubscriptionStatsResponse,
  WebhookSubscriptionTestPingResponse,
} from '../types/index';

const BASE = '/api/v1/webhooks/subscriptions';

const mockSubscription: WebhookSubscriptionResponse = {
  id: toEntityId<'WebhookSubscription'>('sub-001'),
  targetUrl: 'https://example.com/webhook',
  eventType: 'document.uploaded',
  status: WebhookSubscriptionStatus.Active,
  consecutiveFailureCount: 0,
  lastSuccessAt: toISODateString('2026-03-20T10:00:00Z'),
  createdAt: toISODateString('2026-03-01T08:00:00Z'),
  modifiedAt: null,
  signingSecretHint: 'whsec_b46a****************5182',
};

describe('webhooks-api', () => {
  // ── CRUD ────────────────────────────────────────────────────────────────

  describe('getSubscription', () => {
    it('sends GET to /{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockSubscription });

      const result = await getSubscription(client, BASE, 'sub-001');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/sub-001`);
      expect(result).toEqual(mockSubscription);
    });

    it('encodes subscription ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockSubscription });

      await getSubscription(client, BASE, 'id/slash');

      expect(client.get).toHaveBeenCalledWith(`${BASE}/id%2Fslash`);
    });
  });

  describe('createSubscription', () => {
    it('sends POST with request body', async () => {
      const client = createMockClient();
      const response: WebhookSubscriptionCreatedResponse = {
        id: toEntityId<'WebhookSubscription'>('sub-002'),
        targetUrl: 'https://example.com/webhook',
        eventType: 'document.uploaded',
        status: WebhookSubscriptionStatus.Active,
        signingSecret: 'whsec_abc123',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await createSubscription(client, BASE, {
        targetUrl: 'https://example.com/webhook',
        eventType: 'document.uploaded',
      });

      expect(client.post).toHaveBeenCalledWith(BASE, {
        targetUrl: 'https://example.com/webhook',
        eventType: 'document.uploaded',
      });
      expect(result).toEqual(response);
    });
  });

  describe('updateSubscription', () => {
    it('sends PUT to /{id} with request body', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValueOnce({ data: mockSubscription });

      const result = await updateSubscription(client, BASE, 'sub-001', {
        targetUrl: 'https://example.com/v2/webhook',
      });

      expect(client.put).toHaveBeenCalledWith(`${BASE}/sub-001`, {
        targetUrl: 'https://example.com/v2/webhook',
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('deleteSubscription', () => {
    it('sends DELETE to /{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

      await deleteSubscription(client, BASE, 'sub-001');

      expect(client.delete).toHaveBeenCalledWith(`${BASE}/sub-001`);
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  describe('activateSubscription', () => {
    it('sends POST to /{id}/activate', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockSubscription });

      const result = await activateSubscription(client, BASE, 'sub-001');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/sub-001/activate`);
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('suspendSubscription', () => {
    it('sends POST to /{id}/suspend', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockSubscription });

      const result = await suspendSubscription(client, BASE, 'sub-001');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/sub-001/suspend`);
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('deactivateSubscription', () => {
    it('sends POST to /{id}/deactivate with reason', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: mockSubscription });

      const result = await deactivateSubscription(client, BASE, 'sub-001', {
        reason: 'No longer needed',
      });

      expect(client.post).toHaveBeenCalledWith(`${BASE}/sub-001/deactivate`, {
        reason: 'No longer needed',
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  // ── Operations ────────────────────────────────────────────────────────────

  describe('rotateSecret', () => {
    it('sends POST to /{id}/rotate-secret', async () => {
      const client = createMockClient();
      const response: WebhookSubscriptionRotateSecretResponse = {
        signingSecret: 'whsec_new456',
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await rotateSecret(client, BASE, 'sub-001');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/sub-001/rotate-secret`);
      expect(result).toEqual(response);
    });
  });

  describe('testPing', () => {
    it('sends POST to /{id}/test-ping', async () => {
      const client = createMockClient();
      const response: WebhookSubscriptionTestPingResponse = {
        success: true,
        httpStatusCode: 200,
        durationMs: 142,
      };
      vi.mocked(client.post).mockResolvedValueOnce({ data: response });

      const result = await testPing(client, BASE, 'sub-001');

      expect(client.post).toHaveBeenCalledWith(`${BASE}/sub-001/test-ping`);
      expect(result).toEqual(response);
    });
  });

  describe('getStats', () => {
    it('sends GET to /stats', async () => {
      const client = createMockClient();
      const response: WebhookSubscriptionStatsResponse = {
        totalSubscriptions: 10,
        activeCount: 7,
        suspendedCount: 2,
        deactivatedCount: 1,
        deliveriesLast24h: 523,
        successRateLast24h: 99.2,
        avgResponseTimeMsLast24h: 85,
      };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getStats(client, BASE);

      expect(client.get).toHaveBeenCalledWith(`${BASE}/stats`);
      expect(result).toEqual(response);
    });
  });

  // ── Discovery ─────────────────────────────────────────────────────────────

  describe('getEventTypes', () => {
    it('sends GET to /event-types on the webhooks root path', async () => {
      const client = createMockClient();
      const response: WebhookEventTypeResponse[] = [
        {
          eventType: 'document.uploaded',
          displayName: 'Document uploaded',
          description: null,
          category: 'Documents',
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getEventTypes(client, '/api/v1/webhooks');

      expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/event-types');
      expect(result).toEqual(response);
    });
  });

  describe('getConfig', () => {
    it('sends GET to /config on the webhooks root path', async () => {
      const client = createMockClient();
      const response: WebhookModuleConfig = { storePayload: false };
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getConfig(client, '/api/v1/webhooks');

      expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/config');
      expect(result).toEqual(response);
    });
  });

  // ── Deliveries ────────────────────────────────────────────────────────────

  describe('getDeliveries', () => {
    it('sends GET to /deliveries with subscriptionId param', async () => {
      const client = createMockClient();
      const response: WebhookDeliveryAttemptResponse[] = [
        {
          deliveryId: toEntityId<'WebhookDelivery'>('del-001'),
          subscriptionId: toEntityId<'WebhookSubscription'>('sub-001'),
          tenantId: null,
          eventType: 'document.uploaded',
          targetUrl: 'https://example.com/webhook',
          httpStatusCode: 200,
          payloadHash: 'a'.repeat(64),
          occurredAt: toISODateString('2026-03-20T10:00:00Z'),
          durationMs: 142,
          errorMessage: null,
          isSuccess: true,
          payload: null,
        },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: response });

      const result = await getDeliveries(client, '/api/v1/webhooks', { subscriptionId: 'sub-001' });

      expect(client.get).toHaveBeenCalledWith('/api/v1/webhooks/deliveries', {
        params: { subscriptionId: 'sub-001' },
      });
      expect(result).toEqual(response);
    });
  });

  describe('retryDelivery', () => {
    it('sends POST to /deliveries/{deliveryId}/retry', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await retryDelivery(client, '/api/v1/webhooks', 'del-001');

      expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/deliveries/del-001/retry');
    });

    it('encodes delivery ID with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

      await retryDelivery(client, '/api/v1/webhooks', 'id/slash');

      expect(client.post).toHaveBeenCalledWith('/api/v1/webhooks/deliveries/id%2Fslash/retry');
    });
  });
});
