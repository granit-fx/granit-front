import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';

import { TemplatingProvider } from '../providers/templating-provider.js';

import type { AxiosInstance } from 'axios';

export { axiosResponse, createMockClient } from '@granit/testing';

export function createWrapper(
  client: AxiosInstance,
  basePath?: string,
  queryKeyPrefix?: readonly string[]
) {
  const queryClient = createTestQueryClient();
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
