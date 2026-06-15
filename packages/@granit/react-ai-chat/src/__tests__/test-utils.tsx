import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { AIChatProvider } from '../providers/ai-chat-provider';

import type { AIChatConfig } from '../providers/ai-chat-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export const TEST_BASE_PATH = '/api/v1/conversations';

/** Wraps hooks in a fresh QueryClient + AIChatProvider bound to `client`. */
export function createWrapper(client: AxiosInstance, basePath = TEST_BASE_PATH) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AIChatConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AIChatProvider config={config}>{children}</AIChatProvider>
    );
  };
}

/** Build an SSE `ReadableStream` from raw frame strings. */
export function createSSEStream(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}
