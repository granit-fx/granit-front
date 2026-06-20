import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDefaultMentionResolve } from '../hooks/use-default-mention-resolve';

import { createWrapper } from './test-utils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDefaultMentionResolve', () => {
  it('rehydrates a composite value via /lookups/mentions/resolve and maps it onto MentionOption', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        value: 'user:u-42',
        label: 'Ada Lovelace',
        extra: { type: 'user', email: 'ada@x.io' },
      })
    );

    const { result } = renderHook(() => useDefaultMentionResolve(), {
      wrapper: createWrapper(client),
    });

    const option = await result.current!('user:u-42');

    expect(client.get).toHaveBeenCalledWith('/lookups/mentions/resolve', {
      params: { value: 'user:u-42' },
      signal: undefined,
    });
    expect(option).toEqual({
      type: 'user',
      id: 'u-42',
      label: 'Ada Lovelace',
      description: 'ada@x.io',
    });
  });

  it('returns null when the value is unknown (HTTP 404)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 404 } });

    const { result } = renderHook(() => useDefaultMentionResolve(), {
      wrapper: createWrapper(client),
    });

    await expect(result.current!('user:nope')).resolves.toBeNull();
  });

  it('returns undefined outside an AIChatProvider', () => {
    const { result } = renderHook(() => useDefaultMentionResolve());
    expect(result.current).toBeUndefined();
  });
});
