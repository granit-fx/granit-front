import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRealTimeNotifications } from '../hooks/use-real-time-notifications';

import { createMockClient, createWrapper } from './test-utils';

describe('useRealTimeNotifications', () => {
  it('should return initial state with null lastMessage', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { count: 0 } });

    const { result } = renderHook(() => useRealTimeNotifications(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.lastMessage).toBeNull();
    expect(result.current.connectionState).toBeDefined();
  });
});
