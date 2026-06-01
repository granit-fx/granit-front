import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ActivitiesProvider,
  buildActivitiesQueryKey,
  useActivitiesConfig,
} from '../providers/activities-provider';

import type { ActivitiesConfig } from '../providers/activities-provider';
import type { ReactNode } from 'react';

describe('ActivitiesProvider', () => {
  it('exposes the resolved config (default basePath + queryKeyPrefix)', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ActivitiesProvider config={{ client }}>{children}</ActivitiesProvider>
    );

    const { result } = renderHook(() => useActivitiesConfig(), { wrapper });

    expect(result.current.basePath).toBe('/api/v1/activities');
    expect(result.current.queryKeyPrefix).toEqual(['activities']);
    expect(result.current.client).toBe(client);
  });

  it('honors custom basePath and queryKeyPrefix overrides', () => {
    const client = createMockClient();
    const config: ActivitiesConfig = {
      client,
      basePath: '/custom/activities',
      queryKeyPrefix: ['tenant-a', 'activities'],
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ActivitiesProvider config={config}>{children}</ActivitiesProvider>
    );

    const { result } = renderHook(() => useActivitiesConfig(), { wrapper });

    expect(result.current.basePath).toBe('/custom/activities');
    expect(result.current.queryKeyPrefix).toEqual(['tenant-a', 'activities']);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useActivitiesConfig())).toThrow(/ActivitiesProvider/);
  });

  it('throws when no client is available (no config.client and no GranitClientProvider)', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ActivitiesProvider config={{}}>{children}</ActivitiesProvider>
    );

    expect(() => renderHook(() => useActivitiesConfig(), { wrapper })).toThrow(
      /requires an Axios client/
    );
  });
});

describe('buildActivitiesQueryKey', () => {
  it('prepends the configured prefix to extra segments', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ActivitiesProvider config={{ client, queryKeyPrefix: ['p'] }}>{children}</ActivitiesProvider>
    );

    const { result } = renderHook(() => useActivitiesConfig(), { wrapper });

    expect(buildActivitiesQueryKey(result.current, 'list')).toEqual(['p', 'list']);
    expect(buildActivitiesQueryKey(result.current, 'detail', 'act-1')).toEqual([
      'p',
      'detail',
      'act-1',
    ]);
  });
});
