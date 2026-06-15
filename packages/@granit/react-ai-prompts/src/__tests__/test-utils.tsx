import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { AIPromptsProvider } from '../providers/ai-prompts-provider';

import type { AIPromptsConfig } from '../providers/ai-prompts-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export const TEST_BASE_PATH = '/api/v1/prompts';

/** Wraps hooks in a fresh QueryClient + AIPromptsProvider bound to `client`. */
export function createWrapper(client: AxiosInstance, basePath = TEST_BASE_PATH) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AIPromptsConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AIPromptsProvider config={config}>{children}</AIPromptsProvider>
    );
  };
}
