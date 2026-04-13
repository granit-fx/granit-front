import { fetchDeviceTokens } from '@granit/notifications-mobile-push';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { deviceTokenKeys, useDeviceTokens } from '../hooks/use-device-tokens.js';
import { MobilePushProvider } from '../providers/mobile-push-provider.js';

import type { MobilePushTokenResponse } from '@granit/notifications-mobile-push';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/notifications-mobile-push', () => ({
  fetchDeviceTokens: vi.fn(),
}));

const mockTokens: readonly MobilePushTokenResponse[] = [
  {
    deviceToken: 'token-abc-123',
    platform: 'android',
    createdAt: '2026-03-17T10:00:00Z',
  },
  {
    deviceToken: 'token-def-456',
    platform: 'ios',
    createdAt: '2026-03-17T09:00:00Z',
  },
];

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <MobilePushProvider config={{ client, basePath }}>{children}</MobilePushProvider>
      </QueryClientProvider>
    );
  };
}

describe('deviceTokenKeys', () => {
  it('should produce stable list key', () => {
    expect(deviceTokenKeys.list()).toEqual(['device-tokens', 'list']);
  });
});

describe('useDeviceTokens', () => {
  it('should fetch device tokens with default basePath', async () => {
    vi.mocked(fetchDeviceTokens).mockResolvedValueOnce(mockTokens);

    const client = createMockClient();
    const wrapper = createWrapper(client);
    const { result } = renderHook(() => useDeviceTokens(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchDeviceTokens).toHaveBeenCalledWith(client, '/api/v1/notifications');
    expect(result.current.data).toEqual(mockTokens);
  });

  it('should fetch device tokens with custom basePath', async () => {
    vi.mocked(fetchDeviceTokens).mockResolvedValueOnce(mockTokens);

    const client = createMockClient();
    const wrapper = createWrapper(client, '/custom/api');
    const { result } = renderHook(() => useDeviceTokens(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchDeviceTokens).toHaveBeenCalledWith(client, '/custom/api');
  });

  it('should handle fetch error', async () => {
    vi.mocked(fetchDeviceTokens).mockRejectedValueOnce(new Error('Unauthorized'));

    const client = createMockClient();
    const wrapper = createWrapper(client);
    const { result } = renderHook(() => useDeviceTokens(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Unauthorized');
  });

  it('should return empty array when no tokens exist', async () => {
    vi.mocked(fetchDeviceTokens).mockResolvedValueOnce([]);

    const client = createMockClient();
    const wrapper = createWrapper(client);
    const { result } = renderHook(() => useDeviceTokens(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});
