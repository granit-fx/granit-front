import { createMockClient } from '@granit/react-testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  PresenceProvider,
  buildPresenceQueryKey,
  usePresenceConfig,
} from '../providers/presence-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function wrap(client: AxiosInstance) {
  return ({ children }: Readonly<{ children: ReactNode }>) => (
    <PresenceProvider config={{ client }}>{children}</PresenceProvider>
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

  it('throws if used outside a provider', () => {
    expect(() => renderHook(() => usePresenceConfig())).toThrowError(
      /must be used within a <PresenceProvider>/
    );
  });
});
