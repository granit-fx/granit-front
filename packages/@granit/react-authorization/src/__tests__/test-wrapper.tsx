import { composeWrappers, createQueryWrapper, createTestQueryClient } from '@granit/react-testing';

import { AuthorizationProvider } from '../providers/authorization-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';

/**
 * Builds a `renderHook` wrapper that provides both a TanStack QueryClient and an
 * `<AuthorizationProvider>` carrying the given Axios `client` (and optional
 * `basePath`). The authorization hooks resolve their client internally from this
 * provider, so tests no longer pass `{ client }` per call.
 */
export function createAuthorizationWrapper(
  client: AxiosInstance,
  options: { readonly basePath?: string; readonly queryClient?: QueryClient } = {}
): ComponentType<Readonly<{ children: ReactNode }>> {
  return composeWrappers(
    createQueryWrapper(options.queryClient ?? createTestQueryClient()),
    ({ children }: Readonly<{ children: ReactNode }>) => (
      <AuthorizationProvider config={{ client, basePath: options.basePath }}>
        {children}
      </AuthorizationProvider>
    )
  );
}
