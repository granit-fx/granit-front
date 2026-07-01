import { composeWrappers, createQueryWrapper, createTestQueryClient } from '@granit/react-testing';

import { ApiKeysProvider } from '../providers/api-keys-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';

/**
 * Builds a `renderHook` wrapper providing both a TanStack QueryClient and an
 * `<ApiKeysProvider>` carrying the given Axios `client` (and optional
 * `basePath`). The api-key hooks resolve their client internally from this
 * provider, so tests no longer pass `{ client }` per call.
 */
export function createApiKeysWrapper(
  client: AxiosInstance,
  options: { readonly basePath?: string; readonly queryClient?: QueryClient } = {}
): ComponentType<Readonly<{ children: ReactNode }>> {
  return composeWrappers(
    createQueryWrapper(options.queryClient ?? createTestQueryClient()),
    ({ children }: Readonly<{ children: ReactNode }>) => (
      <ApiKeysProvider config={{ client, basePath: options.basePath }}>{children}</ApiKeysProvider>
    )
  );
}
