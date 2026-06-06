import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TemplatingProvider } from '../providers/templating-provider';

import type { AxiosInstance } from 'axios';

export { axiosResponse, createMockClient } from '@granit/testing';

export function createWrapper(
  client: AxiosInstance,
  basePath?: string,
  queryKeyPrefix?: readonly string[]
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, throwOnError: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
      <QueryClientProvider client={queryClient}>
        <TemplatingProvider config={{ client, basePath, queryKeyPrefix }}>
          {children}
        </TemplatingProvider>
      </QueryClientProvider>
    );
  };
}
