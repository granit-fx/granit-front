import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';

import { EntityMergeProvider } from '../providers/entity-merge-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** QueryClientProvider + EntityMergeProvider wrapper for hook/component tests. */
export function createEntityMergeHarness(client: AxiosInstance, basePath = '/api/v1/mergeables') {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={queryClient}>
        <EntityMergeProvider config={{ client, basePath }}>{children}</EntityMergeProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, wrapper };
}
