import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useTemplatingConfig } from '../providers/templating-provider.js';

import { createMockClient, createWrapper } from './test-utils.tsx';

describe('TemplatingProvider', () => {
  it('should provide config to children', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplatingConfig(), {
      wrapper: createWrapper(client, '/api/v1/templating', ['templates']),
    });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1/templating');
    expect(result.current.queryKeyPrefix).toEqual(['templates']);
  });

  it('should use default basePath and queryKeyPrefix', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useTemplatingConfig(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.basePath).toBe('/api/v1/templating');
    expect(result.current.queryKeyPrefix).toEqual(['templates']);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useTemplatingConfig());
    }).toThrow('useTemplatingConfig must be used within a <TemplatingProvider>');
  });
});
