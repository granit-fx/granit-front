import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createQueryWrapper, createTestQueryClient } from '../query-helpers';

describe('createTestQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = createTestQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('disables retry on queries', () => {
    const client = createTestQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(false);
  });

  it('disables retry on mutations', () => {
    const client = createTestQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(false);
  });
});

describe('createQueryWrapper', () => {
  it('returns a React component', () => {
    const Wrapper = createQueryWrapper();
    expect(typeof Wrapper).toBe('function');
  });

  it('provides a QueryClient to children via context', () => {
    const { result } = renderHook(() => useQueryClient(), {
      wrapper: createQueryWrapper(),
    });
    expect(result.current).toBeInstanceOf(QueryClient);
  });

  it('uses a custom QueryClient when provided', () => {
    const custom = createTestQueryClient();
    const { result } = renderHook(() => useQueryClient(), {
      wrapper: createQueryWrapper(custom),
    });
    expect(result.current).toBe(custom);
  });
});
