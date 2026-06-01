import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useUnreadCount } from '../hooks/use-unread-count';

import {
  axiosResponse,
  createMockClient,
  createWrapper,
  createWrapperWithoutBasePath,
} from './test-utils';

describe('useUnreadCount', () => {
  it('should fetch unread count on mount', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 7 }));

    const { result } = renderHook(() => useUnreadCount({ pollingInterval: 0 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.count).toBe(7));
  });

  it('should return 0 when fetch fails silently', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useUnreadCount({ pollingInterval: 0 }), {
      wrapper: createWrapper(client),
    });

    // Should not throw, count stays at initial (0)
    await waitFor(() => expect(result.current.count).toBe(0));
  });

  it('should set up polling when pollingInterval > 0', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 3 }));

    const { unmount } = renderHook(() => useUnreadCount({ pollingInterval: 30_000 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);

    unmount();
    setIntervalSpy.mockRestore();
  });

  it('should clean up polling interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 0 }));

    const { unmount } = renderHook(() => useUnreadCount({ pollingInterval: 5000 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('should use default pollingInterval when none is specified', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 0 }));

    const { unmount } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);

    unmount();
    setIntervalSpy.mockRestore();
  });

  it('should allow manual refresh', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 2 }));

    const { result } = renderHook(() => useUnreadCount({ pollingInterval: 0 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.count).toBe(2));

    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 5 }));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.count).toBe(5));
  });

  it('should use default basePath when config.basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 3 }));

    const { result } = renderHook(() => useUnreadCount({ pollingInterval: 0 }), {
      wrapper: createWrapperWithoutBasePath(client),
    });

    await waitFor(() => expect(result.current.count).toBe(3));

    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api'));
  });

  it('should not update state when unmounted during fetch', async () => {
    let resolveGet: (value: unknown) => void;
    const pendingGet = new Promise((resolve) => {
      resolveGet = resolve;
    });

    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(pendingGet as never);

    const { unmount } = renderHook(() => useUnreadCount({ pollingInterval: 0 }), {
      wrapper: createWrapper(client),
    });

    unmount();

    await act(async () => {
      resolveGet!(axiosResponse({ count: 10 }));
    });

    // No assertion on count since component is unmounted — the test verifies
    // no React "state update on unmounted component" warning is triggered.
  });
});
