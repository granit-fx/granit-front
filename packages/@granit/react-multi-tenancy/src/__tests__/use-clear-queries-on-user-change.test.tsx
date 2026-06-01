import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useClearQueriesOnUserChange } from '../hooks/use-clear-queries-on-user-change';

import type { ReactNode } from 'react';

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useClearQueriesOnUserChange', () => {
  it('does not clear on mount with a stable user id', () => {
    const client = new QueryClient();
    const clear = vi.spyOn(client, 'clear');

    renderHook(() => useClearQueriesOnUserChange('user-1'), { wrapper: wrap(client) });

    expect(clear).not.toHaveBeenCalled();
  });

  it('clears the cache when the user id changes', () => {
    const client = new QueryClient();
    const clear = vi.spyOn(client, 'clear');

    const { rerender } = renderHook(
      ({ uid }: { uid: string | undefined }) => useClearQueriesOnUserChange(uid),
      {
        wrapper: wrap(client),
        initialProps: { uid: 'user-1' as string | undefined },
      }
    );

    rerender({ uid: 'user-2' });
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('clears on login (undefined -> string)', () => {
    const client = new QueryClient();
    const clear = vi.spyOn(client, 'clear');

    const { rerender } = renderHook(
      ({ uid }: { uid: string | undefined }) => useClearQueriesOnUserChange(uid),
      {
        wrapper: wrap(client),
        initialProps: { uid: undefined as string | undefined },
      }
    );

    rerender({ uid: 'user-1' });
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('clears on logout (string -> undefined)', () => {
    const client = new QueryClient();
    const clear = vi.spyOn(client, 'clear');

    const { rerender } = renderHook(
      ({ uid }: { uid: string | undefined }) => useClearQueriesOnUserChange(uid),
      {
        wrapper: wrap(client),
        initialProps: { uid: 'user-1' as string | undefined },
      }
    );

    rerender({ uid: undefined });
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
