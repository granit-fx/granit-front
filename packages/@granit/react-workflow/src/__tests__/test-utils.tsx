export { axiosResponse, createMockClient } from '@granit/testing';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';
import { WorkflowProvider } from '../providers/workflow-provider';

import type { AxiosInstance } from 'axios';

export function createWrapper(client: AxiosInstance, basePath = DEFAULT_BASE_PATH) {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity, throwOnError: false },
        mutations: { retry: false },
      },
    });
    return (
      <QueryClientProvider client={queryClient}>
        <WorkflowProvider config={{ client, basePath }}>{children}</WorkflowProvider>
      </QueryClientProvider>
    );
  };
}
