import { chatStream } from '@granit/ai';
import { createLogger } from '@granit/logger';
import { useCallback, useRef, useState } from 'react';

import { useAIConfig } from '../providers/ai-provider';

import type { AIChatRequest, AIChatStreamUsage } from '@granit/ai';

const logger = createLogger('react-ai');

export interface UseAIChatStreamReturn {
  /**
   * Accumulated content received so far. Reset on each new `send()` call.
   *
   * ⚠️ **Untrusted.** This is raw model output — steerable by prompt
   * injection, poisoned RAG, or echoed tool results. Render it as plain text,
   * or sanitize it (and scheme-allowlist any links via `@granit/utils`
   * `isSafeUrl`) before rendering as HTML/markdown. Never pass it to
   * `dangerouslySetInnerHTML` unsanitized. See security audit VULN-303.
   */
  readonly content: string;
  /** Whether a stream is currently active. */
  readonly isStreaming: boolean;
  /** Token usage reported by the server at end of stream, or `null`. */
  readonly usage: AIChatStreamUsage | null;
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
 * @remarks
 * Security: `content` is untrusted model output — see the field doc before
 * rendering it. Request size is bounded server-side; keep client `messages`
 * reasonable to avoid wasted bandwidth (no hard client clamp is imposed —
 * tracked as VULN-304).
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
  const [usage, setUsage] = useState<AIChatStreamUsage | null>(null);
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
      setUsage(null);
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          let accumulated = '';
          for await (const event of chatStream(
            config.client,
            config.basePath,
            workspaceName,
            request,
            controller.signal
          )) {
            if (event.type === 'chunk') {
              accumulated += event.content;
              setContent(accumulated);
            } else if (event.type === 'usage') {
              setUsage(event.usage);
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          logger.error('AI chat stream failed', err, { workspaceName });
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsStreaming(false);
          abortRef.current = null;
        }
      })();
    },
    [abort, config]
  );

  return { content, isStreaming, usage, error, send, abort };
}
