import { chatComplete } from '@granit/ai';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIConfig } from '../providers/ai-provider';

import type { AIChatRequest, AIChatResponse } from '@granit/ai';

export interface UseAIChatReturn {
  readonly send: (workspaceName: string, request: AIChatRequest) => void;
  readonly sendAsync: (workspaceName: string, request: AIChatRequest) => Promise<AIChatResponse>;
  readonly data: AIChatResponse | undefined;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation for non-streaming chat completion.
 *
 * @example
 * ```tsx
 * const { sendAsync, data, isPending } = useAIChat();
 * const response = await sendAsync('default', {
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 * ```
 */
export function useAIChat(): UseAIChatReturn {
  const config = useAIConfig();

  const mutation = useMutation({
    mutationFn: ({ workspaceName, request }: { workspaceName: string; request: AIChatRequest }) =>
      chatComplete(config.client, config.basePath ?? '', workspaceName, request),
  });

  const send = useCallback(
    (workspaceName: string, request: AIChatRequest) => {
      mutation.mutate({ workspaceName, request });
    },
    [mutation]
  );

  const sendAsync = useCallback(
    async (workspaceName: string, request: AIChatRequest) => {
      return mutation.mutateAsync({ workspaceName, request });
    },
    [mutation]
  );

  return {
    send,
    sendAsync,
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
