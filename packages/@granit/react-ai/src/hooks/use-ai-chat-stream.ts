import { chatStream } from '@granit/ai';
import { useCallback, useRef, useState } from 'react';

import { useAIConfig } from '../providers/ai-provider.js';

import type { AIChatRequest } from '@granit/ai';

export interface UseAIChatStreamReturn {
  /** Accumulated content received so far. Reset on each new `send()` call. */
  readonly content: string;
  /** Whether a stream is currently active. */
  readonly isStreaming: boolean;
  /** Error from the last stream attempt, or `null`. */
  readonly error: Error | null;
  /** Start a new streaming chat. Aborts any in-progress stream first. */
  readonly send: (workspaceName: string, request: AIChatRequest) => void;
  /** Abort the current stream. */
  readonly abort: () => void;
}

/**
 * Streaming chat completion via SSE.
 *
 * Accumulates content chunks into `content` as they arrive.
 * Each call to `send()` resets the accumulated content.
 *
 * @example
 * ```tsx
 * const { content, isStreaming, send } = useAIChatStream();
 *
 * <button onClick={() => send('default', { messages: [{ role: 'user', content: 'Hello' }] })}>
 *   Send
 * </button>
 * <p>{content}</p>
 * ```
 */
export function useAIChatStream(): UseAIChatStreamReturn {
  const config = useAIConfig();
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(
    (workspaceName: string, request: AIChatRequest) => {
      abort();
      setContent('');
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          let accumulated = '';
          for await (const chunk of chatStream(
            config.client,
            config.basePath ?? '',
            workspaceName,
            request,
            controller.signal,
          )) {
            accumulated += chunk;
            setContent(accumulated);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsStreaming(false);
          abortRef.current = null;
        }
      })();
    },
    [abort, config],
  );

  return { content, isStreaming, error, send, abort };
}
