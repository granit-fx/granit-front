import { createMockClient } from '@granit/react-testing';
import { toEntityId } from '@granit/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { presenceKeys } from '../hooks/query-keys';
import {
  PresenceProvider,
  buildPresenceQueryKey,
  usePresenceConfig,
} from '../providers/presence-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { UserId } from '@granit/types';
import type { ReactNode } from 'react';

function wrap(client: AxiosInstance, prefix?: readonly string[]) {
  return ({ children }: Readonly<{ children: ReactNode }>) => (
    <PresenceProvider config={prefix ? { client, queryKeyPrefix: prefix } : { client }}>
      {children}
    </PresenceProvider>
  );
}

describe('PresenceProvider', () => {
  it('exposes the resolved config with default basePath and prefix', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePresenceConfig(), { wrapper: wrap(client) });
    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1');
    expect(result.current.queryKeyPrefix).toEqual(['presence']);
  });

  it('builds query keys under the prefix', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePresenceConfig(), { wrapper: wrap(client) });
    expect(buildPresenceQueryKey(result.current, 'my')).toEqual(['presence', 'my']);
  });

  it('composes the provider prefix with the key factory without duplication', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePresenceConfig(), { wrapper: wrap(client) });
    const myKey = buildPresenceQueryKey(result.current, ...presenceKeys.my());
    expect(myKey).toEqual(['presence', 'my']);

    const userKey = buildPresenceQueryKey(
      result.current,
      ...presenceKeys.user(toEntityId<'User'>('user-1') as UserId)
    );
    expect(userKey).toEqual(['presence', 'user', 'user-1']);
  });

  it('honours a custom queryKeyPrefix', () => {
    const client = createMockClient();
    const { result } = renderHook(() => usePresenceConfig(), {
      wrapper: wrap(client, ['tenant-a', 'presence']),
    });
    expect(buildPresenceQueryKey(result.current, ...presenceKeys.my())).toEqual([
      'tenant-a',
      'presence',
      'my',
    ]);
  });

  it('throws if used outside a provider', () => {
    expect(() => renderHook(() => usePresenceConfig())).toThrowError(
      /must be used within a <PresenceProvider>/
    );
  });
});
