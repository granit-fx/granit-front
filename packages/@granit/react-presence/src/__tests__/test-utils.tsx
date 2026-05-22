import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';

import { PresenceProvider } from '../providers/presence-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Builds a wrapper that exposes both a fresh QueryClient and a
 * PresenceProvider wired to the supplied Axios client.
 */
export function createPresenceTestHarness(client: AxiosInstance) {
  const queryClient: QueryClient = createTestQueryClient();
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => (
    <QueryClientProvider client={queryClient}>
      <PresenceProvider config={{ client }}>{children}</PresenceProvider>
    </QueryClientProvider>
  );
  return { queryClient, wrapper };
}
