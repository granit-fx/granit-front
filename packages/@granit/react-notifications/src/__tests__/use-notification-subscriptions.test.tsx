import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  useEntityFollowers,
  useFollowEntity,
  useNotificationSubscriptions,
  useNotificationTypes,
  useSubscribeToNotificationType,
  useUnfollowEntity,
  useUnsubscribeFromNotificationType,
} from '../hooks/use-notification-subscriptions';
import { NotificationProvider } from '../providers/notification-provider';

import { axiosResponse, createMockClient } from './test-utils';

import type {
  NotificationConfig,
  NotificationDefinition,
  NotificationSubscriptionResponse,
} from '@granit/notifications';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance, basePath = '/api/v1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => {
    const config: NotificationConfig = { apiClient: client, basePath };
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider config={config}>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  };
}

const MOCK_TYPES: NotificationDefinition[] = [
  {
    name: 'NewMessage',
    defaultSeverity: 'Info',
    defaultChannels: ['InApp'],
    displayName: 'New message',
    description: null,
    groupName: 'inbox',
    allowUserOptOut: true,
    allowDoNotDisturbBypass: false,
    requiredPermission: null,
    requiredFeature: null,
  },
];

const MOCK_SUBS: NotificationSubscriptionResponse[] = [
  {
    typeName: 'NewMessage',
    channels: ['inApp'],
  } as unknown as NotificationSubscriptionResponse,
];

describe('useNotificationTypes', () => {
  it('fetches notification definitions', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_TYPES));

    const { result } = renderHook(() => useNotificationTypes(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_TYPES);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/notifications/types'));
  });
});

describe('useNotificationSubscriptions', () => {
  it('lists current-user subscriptions', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_SUBS));

    const { result } = renderHook(() => useNotificationSubscriptions(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_SUBS);
  });
});

describe('useSubscribeToNotificationType', () => {
  it('POSTs to the subscriptions endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useSubscribeToNotificationType(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync('NewMessage');
    });

    expect(client.post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/subscriptions/NewMessage')
    );
  });
});

describe('useUnsubscribeFromNotificationType', () => {
  it('DELETEs the subscription endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUnsubscribeFromNotificationType(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync('NewMessage');
    });

    expect(client.delete).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/subscriptions/NewMessage')
    );
  });
});

describe('useFollowEntity', () => {
  it('POSTs to the follow endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useFollowEntity(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ entityType: 'Invoice', entityId: 'inv-1' });
    });

    expect(client.post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/entity/Invoice/inv-1/follow')
    );
  });
});

describe('useUnfollowEntity', () => {
  it('DELETEs the follow endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUnfollowEntity(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ entityType: 'Invoice', entityId: 'inv-1' });
    });

    expect(client.delete).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/entity/Invoice/inv-1/follow')
    );
  });
});

describe('useEntityFollowers', () => {
  it('is disabled when entityType or entityId is empty', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    renderHook(() => useEntityFollowers('', 'inv-1'), {
      wrapper: createWrapper(client),
    });
    renderHook(() => useEntityFollowers('Invoice', ''), {
      wrapper: createWrapper(client),
    });

    expect(client.get).not.toHaveBeenCalled();
  });

  it('GETs the followers endpoint when both ids are present', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_SUBS));

    const { result } = renderHook(() => useEntityFollowers('Invoice', 'inv-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/entity/Invoice/inv-1/followers')
    );
  });
});
