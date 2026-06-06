import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ComponentType, ReactElement, ReactNode } from 'react';

/**
 * Create a QueryClient configured for tests — retries disabled on both
 * queries and mutations to make tests deterministic and fast.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/**
 * Create a wrapper component that provides a QueryClientProvider.
 * Useful as the `wrapper` option in `renderHook()` and `render()`.
 *
 * @param queryClient - Optional custom QueryClient. Defaults to `createTestQueryClient()`.
 */
export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function QueryWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Compose multiple wrapper components into a single wrapper.
 * Useful when a test needs to nest several providers (e.g. a module provider
 * plus a QueryClientProvider).
 *
 * @example
 * const wrapper = composeWrappers(
 *   createQueryWrapper(),
 *   ({ children }) => <MultiTenancyProvider config={config}>{children}</MultiTenancyProvider>,
 * );
 * renderHook(() => useMyHook(), { wrapper });
 */
export function composeWrappers(
  ...wrappers: Array<ComponentType<Readonly<{ children: ReactNode }>>>
): ComponentType<Readonly<{ children: ReactNode }>> {
  return function ComposedWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return wrappers.reduceRight<ReactNode>(
      (acc, Wrapper) => <Wrapper>{acc}</Wrapper>,
      children
    ) as ReactElement;
  };
}
