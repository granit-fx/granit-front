import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { BlogProvider } from '../providers/blog-provider';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Wraps hooks in a fresh QueryClient + BlogProvider bound to the given client. */
export function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BlogProvider, { config: { client }, children })
    );
  };
}
