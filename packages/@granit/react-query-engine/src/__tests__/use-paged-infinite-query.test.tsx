import { createQueryWrapper } from '@granit/react-testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePagedInfiniteQuery } from '../hooks/use-paged-infinite-query';

import type { InfinitePageResult } from '../hooks/use-paged-infinite-query';

interface CursorPage extends InfinitePageResult<string> {
  readonly nextCursor: string | null;
}

interface OffsetPage extends InfinitePageResult<string> {
  readonly totalCount: number;
}

const ITEMS = Array.from({ length: 5 }, (_, i) => `item-${i}`);

describe('usePagedInfiniteQuery', () => {
  it('accumulates pages in CURSOR mode and stops when nextCursor is null', async () => {
    const fetchPage = vi.fn(({ pageParam }: { pageParam: string | undefined }) => {
      const start = pageParam ? Number(pageParam) : 0;
      const end = start + 2;
      return Promise.resolve<CursorPage>({
        items: ITEMS.slice(start, end),
        totalCount: null,
        nextCursor: end < ITEMS.length ? String(end) : null,
      });
    });

    const { result } = renderHook(
      () =>
        usePagedInfiniteQuery<string, CursorPage, string | undefined>({
          queryKey: ['t', 'cursor'],
          fetchPage,
          initialPageParam: undefined,
          getNextPageParam: (last) => last.nextCursor ?? undefined,
        }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.totalCount).toBeNull();
    expect(result.current.hasNextPage).toBe(true);

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(4));

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    expect(result.current.items).toEqual(ITEMS);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('accumulates pages in OFFSET mode until totalCount is reached', async () => {
    const fetchPage = vi.fn(({ pageParam }: { pageParam: { page: number } }) => {
      const size = 2;
      const start = (pageParam.page - 1) * size;
      return Promise.resolve<OffsetPage>({
        items: ITEMS.slice(start, start + size),
        totalCount: ITEMS.length,
      });
    });

    const { result } = renderHook(
      () =>
        usePagedInfiniteQuery<string, OffsetPage, { page: number }>({
          queryKey: ['t', 'offset'],
          fetchPage,
          initialPageParam: { page: 1 },
          getNextPageParam: (last, pages) => {
            const fetched = pages.reduce((sum, p) => sum + p.items.length, 0);
            return fetched < last.totalCount ? { page: pages.length + 1 } : undefined;
          },
        }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.totalCount).toBe(5);
    expect(result.current.hasNextPage).toBe(true);

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(4));
    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('does not fetch while disabled', () => {
    const fetchPage = vi.fn(() =>
      Promise.resolve<CursorPage>({ items: [], totalCount: null, nextCursor: null })
    );

    const { result } = renderHook(
      () =>
        usePagedInfiniteQuery<string, CursorPage, string | undefined>({
          queryKey: ['t', 'disabled'],
          fetchPage,
          initialPageParam: undefined,
          getNextPageParam: (last) => last.nextCursor ?? undefined,
          enabled: false,
        }),
      { wrapper: createQueryWrapper() }
    );

    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });
});
