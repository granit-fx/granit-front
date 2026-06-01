import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  listDeviceTokens,
  registerDeviceToken,
  unregisterDeviceToken,
} from '../api/mobile-push-api';

describe('mobile-push-api', () => {
  it('should register a device token', async () => {
    const client = createMockClient();

    await registerDeviceToken(client, '/api/v1', {
      token: 'fcm-token-123',
      platform: 'android',
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/notifications/mobile-push/tokens', {
      token: 'fcm-token-123',
      platform: 'android',
    });
  });

  it('should unregister a device token', async () => {
    const client = createMockClient();

    await unregisterDeviceToken(client, '/api/v1', 'fcm-token-123');

    expect(client.delete).toHaveBeenCalledWith(
      '/api/v1/notifications/mobile-push/tokens/fcm-token-123'
    );
  });

  it('should encode special characters in token for unregister', async () => {
    const client = createMockClient();

    await unregisterDeviceToken(client, '/api/v1', 'token/with+special=chars');

    expect(client.delete).toHaveBeenCalledWith(
      '/api/v1/notifications/mobile-push/tokens/token%2Fwith%2Bspecial%3Dchars'
    );
  });

  it('should fetch all device tokens', async () => {
    const client = createMockClient();
    const tokens = [
      { deviceToken: 'token-1', platform: 'android' as const, createdAt: '2026-03-17T10:00:00Z' },
      { deviceToken: 'token-2', platform: 'ios' as const, createdAt: '2026-03-17T11:00:00Z' },
    ];
    vi.mocked(client.get).mockResolvedValueOnce({ data: tokens });

    const result = await listDeviceTokens(client, '/api/v1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/notifications/mobile-push/tokens');
    expect(result).toEqual(tokens);
  });

  it('should return empty array when no tokens registered', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

    const result = await listDeviceTokens(client, '/api/v1');
    expect(result).toEqual([]);
  });
});
