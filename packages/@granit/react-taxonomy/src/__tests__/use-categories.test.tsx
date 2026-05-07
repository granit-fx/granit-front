import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCategories, useCategory } from '../hooks/use-categories.js';
import { TaxonomyProvider } from '../providers/taxonomy-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryDetailResponse, CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const sampleRoot: CategoryResponse = {
  id: 'cat-1',
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  hasChildren: true,
};

const sampleChild: CategoryResponse = {
  id: 'cat-2',
  scope: 'documents',
  parentId: 'cat-1',
  path: '/legal/contracts',
  name: 'contracts',
  depth: 1,
  hasChildren: false,
};

const sampleDetail: CategoryDetailResponse = {
  ...sampleChild,
  breadcrumb: [sampleRoot, sampleChild],
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

describe('useCategories', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /categories with only scope when no parentId is supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleRoot] });

    const { result } = renderHook(() => useCategories({ scope: 'documents' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/categories', {
      params: { scope: 'documents' },
    });
  });

  it('appends parentId to the query when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleChild] });

    const { result } = renderHook(() => useCategories({ scope: 'documents', parentId: 'cat-1' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/categories', {
      params: { scope: 'documents', parentId: 'cat-1' },
    });
  });
});

describe('useCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /categories/{id} and returns the detail with breadcrumb', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDetail });

    const { result } = renderHook(() => useCategory('cat-2'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-2');
    expect(result.current.data?.breadcrumb).toEqual([sampleRoot, sampleChild]);
  });

  it('does not fire the query when id is empty', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDetail });

    const { result } = renderHook(() => useCategory(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
