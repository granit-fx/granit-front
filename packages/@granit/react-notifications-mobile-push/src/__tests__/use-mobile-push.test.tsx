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
});
