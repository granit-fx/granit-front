import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildTimelineQueryKey, useTimelineConfig } from '../providers/timeline-provider.js';

import { createMockClient, createWrapper } from './test-utils.tsx';

describe('TimelineProvider', () => {
  it('should provide config to child hooks', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useTimelineConfig(), {
      wrapper: createWrapper(client, '/custom/path'),
    });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/custom/path');
  });

  it('should use default basePath', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useTimelineConfig(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.basePath).toBe('/api/v1/timeline');
  });

  it('should use default queryKeyPrefix', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useTimelineConfig(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.queryKeyPrefix).toEqual(['timeline']);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useTimelineConfig());
    }).toThrow('useTimelineConfig must be used within a <TimelineProvider>');
  });
});

describe('buildTimelineQueryKey', () => {
  it('should build query key with default prefix', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useTimelineConfig(), {
      wrapper: createWrapper(client),
    });

    const key = buildTimelineQueryKey(result.current, 'Patient', 'p-1');
    expect(key).toEqual(['timeline', 'Patient', 'p-1']);
  });

  it('should use custom queryKeyPrefix when provided', () => {
    const config = {
      client: createMockClient(),
      basePath: '/api/v1/timeline',
      queryKeyPrefix: ['custom', 'prefix'] as const,
    };

    const key = buildTimelineQueryKey(config, 'entries');
    expect(key).toEqual(['custom', 'prefix', 'entries']);
  });
});
