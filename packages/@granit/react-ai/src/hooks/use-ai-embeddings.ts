import { generateEmbeddings } from '@granit/ai';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIConfig } from '../providers/ai-provider';

import type { AIEmbeddingRequest, AIEmbeddingResponse } from '@granit/ai';

export interface UseAIEmbeddingsReturn {
  readonly generate: (workspaceName: string, request: AIEmbeddingRequest) => void;
  readonly generateAsync: (
    workspaceName: string,
    request: AIEmbeddingRequest
  ) => Promise<AIEmbeddingResponse>;
  readonly data: AIEmbeddingResponse | undefined;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to generate embeddings for a batch of text inputs.
 *
 * @example
 * ```tsx
 * const { generateAsync } = useAIEmbeddings();
 * const result = await generateAsync('default', { inputs: ['Hello world'] });
 * console.log(result.embeddings[0].vector);
 * ```
 */
export function useAIEmbeddings(): UseAIEmbeddingsReturn {
  const config = useAIConfig();

  const mutation = useMutation({
    mutationFn: ({
      workspaceName,
      request,
    }: {
      workspaceName: string;
      request: AIEmbeddingRequest;
    }) => generateEmbeddings(config.client, config.basePath ?? '', workspaceName, request),
  });

  const generate = useCallback(
    (workspaceName: string, request: AIEmbeddingRequest) => {
      mutation.mutate({ workspaceName, request });
    },
    [mutation]
  );

  const generateAsync = useCallback(
    async (workspaceName: string, request: AIEmbeddingRequest) => {
      return mutation.mutateAsync({ workspaceName, request });
    },
    [mutation]
  );

  return {
    generate,
    generateAsync,
    data: mutation.data,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
