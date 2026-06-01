import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePagination } from '../hooks/use-pagination';

import type { PaginationPage } from '../hooks/use-pagination';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePage<T>(items: T[], totalCount: number): PaginationPage<T> {
  return { items, totalCount };
}

function createFetcher(
  totalItems: number,
  generator: (index: number) => string = (i) => `item-${i}`
) {
  return vi.fn(async (page: number, pageSize: number) => {
    const start = (page - 1) * pageSize;
    const items = Array.from({ length: Math.min(pageSize, totalItems - start) }, (_, i) =>
      generator(start + i)
    );
    return makePage(items, totalItems);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePagination', () => {
  it('should load the first page on mount', async () => {
    const fetcher = createFetcher(50);

    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledWith(1, 10);
    expect(result.current.items).toHaveLength(10);
    expect(result.current.totalCount).toBe(50);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.hasPreviousPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('should navigate to the next page', async () => {
    const fetcher = createFetcher(30);
    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.nextPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.page).toBe(2);
    expect(result.current.hasPreviousPage).toBe(true);
    expect(result.current.hasNextPage).toBe(true);
    expect(fetcher).toHaveBeenCalledWith(2, 10);
  });

  it('should navigate to the previous page', async () => {
    const fetcher = createFetcher(30);
    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToPage(3));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.previousPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.page).toBe(2);
  });

  it('should not go below page 1', async () => {
    const fetcher = createFetcher(10);
    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.previousPage());

    expect(result.current.page).toBe(1);
  });

  it('should not go above total pages', async () => {
    const fetcher = createFetcher(20);
    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToPage(999));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.page).toBe(2);
  });

  it('should clamp goToPage to valid range', async () => {
    const fetcher = createFetcher(50);
    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToPage(-5));
    expect(result.current.page).toBe(1);
  });

  it('should refresh the current page', async () => {
    const fetcher = createFetcher(20);
    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToPage(2));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCount = fetcher.mock.calls.length;
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledTimes(callCount + 1);
    expect(fetcher).toHaveBeenLastCalledWith(2, 10);
  });

  it('should handle fetch errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePagination({ fetcher }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should wrap non-Error rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error');

    const { result } = renderHook(() => usePagination({ fetcher }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
  });

  it('should call onSuccess after fetch', async () => {
    const fetcher = createFetcher(10);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10, onSuccess }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ totalCount: 10 }));
  });

  it('should not fetch when enabled is false', async () => {
    const fetcher = createFetcher(10);

    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10, enabled: false }));

    // Should not have started loading
    expect(result.current.loading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should default pageSize to 20', async () => {
    const fetcher = createFetcher(100);

    const { result } = renderHook(() => usePagination({ fetcher }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pageSize).toBe(20);
    expect(fetcher).toHaveBeenCalledWith(1, 20);
  });

  it('should replace items on page change (not append)', async () => {
    const fetcher = createFetcher(30, (i) => `user-${i}`);

    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items[0]).toBe('user-0');

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Items replaced, not appended
    expect(result.current.items).toHaveLength(10);
    expect(result.current.items[0]).toBe('user-10');
  });

  it('should ignore results from aborted fetch on success path', async () => {
    let resolveFirst!: (value: PaginationPage<string>) => void;
    const firstCall = new Promise<PaginationPage<string>>((resolve) => {
      resolveFirst = resolve;
    });

    const fetcher = vi
      .fn()
      .mockReturnValueOnce(firstCall)
      .mockResolvedValue(makePage(['refreshed'], 20));

    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    // refresh() aborts the first in-flight request and starts a new fetch
    act(() => result.current.refresh());

    // Wait for the second fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Resolve the first (now aborted) fetch — its results should be ignored
    resolveFirst(makePage(['stale-page1'], 50));

    // Wait a tick to ensure the stale resolution is processed (and ignored)
    await waitFor(() => expect(result.current.items).toEqual(['refreshed']));

    // The stale result should not overwrite
    expect(result.current.totalCount).toBe(20);
  });

  it('should ignore errors from aborted fetch on error path', async () => {
    let rejectFirst!: (reason: Error) => void;
    const firstCall = new Promise<PaginationPage<string>>((_resolve, reject) => {
      rejectFirst = reject;
    });

    const fetcher = vi
      .fn()
      .mockReturnValueOnce(firstCall)
      .mockResolvedValue(makePage(['ok'], 10));

    const { result } = renderHook(() => usePagination({ fetcher, pageSize: 10 }));

    // refresh() aborts the first in-flight request and starts a new fetch
    act(() => result.current.refresh());

    // Wait for the second fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Reject the first (now aborted) fetch — its error should be ignored
    rejectFirst(new Error('stale error'));

    // The error from the aborted request should not propagate
    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual(['ok']);
  });
});
