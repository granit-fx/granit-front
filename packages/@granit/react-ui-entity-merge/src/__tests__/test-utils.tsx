import { EntityMergeProvider } from '@granit/react-entity-merge';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** QueryClientProvider + EntityMergeProvider wrapper for component tests. */
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
