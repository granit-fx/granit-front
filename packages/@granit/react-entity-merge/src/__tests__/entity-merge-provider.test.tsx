import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  buildEntityMergeQueryKey,
  EntityMergeProvider,
  useEntityMergeConfig,
} from '../providers/entity-merge-provider.js';

import type { EntityMergeConfig } from '../providers/entity-merge-provider.js';
import type { ReactNode } from 'react';

describe('EntityMergeProvider', () => {
  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useEntityMergeConfig())).toThrow(/EntityMergeProvider/);
  });

  it('resolves the config with the supplied client', () => {
    const client = createMockClient();
    const config: EntityMergeConfig = { client, basePath: '/api/v1/parties' };
    const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
      <EntityMergeProvider config={config}>{children}</EntityMergeProvider>
    );
    const { result } = renderHook(() => useEntityMergeConfig(), { wrapper });
    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1/parties');
  });

  it('throws when no client is provided and there is no GranitClientProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
      <EntityMergeProvider config={{ basePath: '/api/v1/parties' }}>{children}</EntityMergeProvider>
    );
    expect(() => renderHook(() => useEntityMergeConfig(), { wrapper })).toThrow(/Axios client/);
    vi.restoreAllMocks();
  });
});

describe('buildEntityMergeQueryKey', () => {
  it('prepends the default prefix', () => {
    expect(buildEntityMergeQueryKey({ basePath: '/x' }, 'a', 'b')).toEqual([
      'entity-merge',
      'a',
      'b',
    ]);
  });

  it('uses a custom prefix when configured', () => {
    expect(
      buildEntityMergeQueryKey({ basePath: '/x', queryKeyPrefix: ['parties'] }, 'merge')
    ).toEqual(['parties', 'merge']);
  });
});
