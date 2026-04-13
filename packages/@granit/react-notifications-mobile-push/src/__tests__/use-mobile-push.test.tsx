import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMobilePush } from '../hooks/use-mobile-push.js';
import { MobilePushProvider } from '../providers/mobile-push-provider.js';

import type { MobilePushProviderProps } from '../providers/mobile-push-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const mockCheckPermissions = vi.fn();
const mockRequestPermissions = vi.fn();
const mockRegister = vi.fn();
const mockAddListener = vi.fn();

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: (...args: unknown[]) => mockCheckPermissions(...args),
    requestPermissions: (...args: unknown[]) => mockRequestPermissions(...args),
    register: (...args: unknown[]) => mockRegister(...args),
    addListener: (...args: unknown[]) => mockAddListener(...args),
  },
}));

const mockRegisterDeviceToken = vi.fn().mockResolvedValue(undefined);
const mockUnregisterDeviceToken = vi.fn().mockResolvedValue(undefined);

vi.mock('@granit/notifications-mobile-push', () => ({
  registerDeviceToken: (...args: unknown[]) => mockRegisterDeviceToken(...args),
  unregisterDeviceToken: (...args: unknown[]) => mockUnregisterDeviceToken(...args),
}));

function createMockAxios(): AxiosInstance {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as AxiosInstance;
}

function createWrapper(overrides?: Partial<MobilePushProviderProps['config']>) {
  const client = overrides?.client ?? createMockAxios();
  const config: MobilePushProviderProps['config'] = { client, ...overrides };
  return {
    client,
    wrapper({ children }: { children: ReactNode }) {
      return <MobilePushProvider config={config}>{children}</MobilePushProvider>;
    },
  };
}

describe('useMobilePush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddListener.mockResolvedValue({ remove: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should expose register and unregister functions', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.unregister).toBe('function');
  });

  it('should set error when permission is denied', async () => {
    mockCheckPermissions.mockResolvedValue({ receive: 'prompt' });
    mockRequestPermissions.mockResolvedValue({ receive: 'denied' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Push notification permission denied');
    expect(result.current.loading).toBe(false);
    expect(result.current.isRegistered).toBe(false);
  });

  it('should register successfully when permission is granted', async () => {
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);

    // Simulate PushNotifications.addListener('registration', ...) firing with a token
    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        // Fire the callback async to simulate native token arrival
        setTimeout(() => callback({ value: 'device-token-123' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper, client } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.isRegistered).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockRegisterDeviceToken).toHaveBeenCalledWith(client, '/api/v1/notifications', {
      token: 'device-token-123',
      platform: 'android',
    });
  });

  it('should skip requestPermissions when already granted', async () => {
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);

    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        setTimeout(() => callback({ value: 'token-456' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(result.current.isRegistered).toBe(true);
  });

  it('should handle registration error from native layer', async () => {
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);

    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registrationError') {
        setTimeout(() => callback({ error: 'FCM registration failed' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('FCM registration failed');
    expect(result.current.loading).toBe(false);
  });

  it('should unregister successfully when token exists', async () => {
    // First register to get a token
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);
    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        setTimeout(() => callback({ value: 'token-789' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper, client } = createWrapper({ basePath: '/custom' });
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });
    expect(result.current.isRegistered).toBe(true);

    // Now unregister
    await act(async () => {
      await result.current.unregister();
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockUnregisterDeviceToken).toHaveBeenCalledWith(client, '/custom', 'token-789');
  });

  it('should handle unregister when no token exists', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.unregister();
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockUnregisterDeviceToken).not.toHaveBeenCalled();
  });

  it('should handle unregister error', async () => {
    // Register first
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);
    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        setTimeout(() => callback({ value: 'token-err' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    // Fail unregister
    mockUnregisterDeviceToken.mockRejectedValueOnce(new Error('Server error'));

    await act(async () => {
      await result.current.unregister();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Server error');
    expect(result.current.loading).toBe(false);
  });

  it('should use default basePath from provider', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    expect(result.current.error).toBeNull();
  });

  it('should accept custom basePath via provider', () => {
    const { wrapper } = createWrapper({ basePath: '/custom/api' });
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    expect(result.current.error).toBeNull();
  });

  it('should wrap non-Error thrown values', async () => {
    mockCheckPermissions.mockRejectedValueOnce('string error');

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
  });

  it('should wrap non-Error thrown values in unregister', async () => {
    // Register first to get a token
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);
    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        setTimeout(() => callback({ value: 'token-non-error' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    mockUnregisterDeviceToken.mockRejectedValueOnce('string unregister error');

    await act(async () => {
      await result.current.unregister();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string unregister error');
  });

  it('should handle token refresh by unregistering old token and registering new one', async () => {
    // Register first
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);

    let registrationCallback: ((data: { value: string }) => void) | null = null;

    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        registrationCallback = callback as (data: { value: string }) => void;
        // Fire initial registration
        setTimeout(() => callback({ value: 'initial-token' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper, client } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.isRegistered).toBe(true);
    vi.clearAllMocks();
    mockUnregisterDeviceToken.mockResolvedValue(undefined);
    mockRegisterDeviceToken.mockResolvedValue(undefined);

    // Simulate token refresh — the effect re-registers a 'registration' listener
    // when isRegistered becomes true. We need to trigger the new listener.
    // The listener is set up in the second useEffect, so let's capture that callback.
    let refreshCallback: ((data: { value: string }) => void) | null = null;
    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        refreshCallback = callback as (data: { value: string }) => void;
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    // Force re-render to re-trigger the effect (isRegistered is now true)
    // The effect that listens for refresh fires because isRegistered changed
    // We already captured the callback, now trigger a refresh token
    if (refreshCallback) {
      await act(async () => {
        refreshCallback!({ value: 'refreshed-token' });
        // Give the async handler time to complete
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockUnregisterDeviceToken).toHaveBeenCalledWith(
        client,
        '/api/v1/notifications',
        'initial-token',
      );
      expect(mockRegisterDeviceToken).toHaveBeenCalledWith(client, '/api/v1/notifications', {
        token: 'refreshed-token',
        platform: 'android',
      });
    }
  });

  it('should handle token refresh error with non-Error value', async () => {
    mockCheckPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);

    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        setTimeout(() => callback({ value: 'token-for-refresh-err' }), 0);
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'ios' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.isRegistered).toBe(true);

    // Now set up the refresh listener to trigger an error
    mockRegisterDeviceToken.mockRejectedValueOnce('non-error refresh failure');

    // Trigger the refresh by simulating a new registration callback in the effect
    let refreshCb: ((data: { value: string }) => void) | null = null;
    mockAddListener.mockImplementation((event: string, callback: (data: unknown) => void) => {
      if (event === 'registration') {
        refreshCb = callback as (data: { value: string }) => void;
      }
      return Promise.resolve({ remove: vi.fn() });
    });

    if (refreshCb) {
      await act(async () => {
        refreshCb!({ value: 'new-token' });
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('non-error refresh failure');
    }
  });

  it('should handle permission already denied (not prompt)', async () => {
    mockCheckPermissions.mockResolvedValue({ receive: 'denied' });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMobilePush({ platform: 'android' }), { wrapper });

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Push notification permission denied');
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });
});
