import { CHAT_STREAM_EVENT_TYPES, streamConversationMessage } from '@granit/ai-chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type {
  ChatStreamEvent,
  ClarificationResponse,
  ConversationId,
  SendMessageRequest,
  SuggestedActionResponse,
} from '@granit/ai-chat';

/** Token usage reported near the end of a turn. */
export interface ChatStreamUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface UseChatStreamReturn {
  /**
   * Accumulated assistant answer for the current turn (delta frames appended
   * in order). Reset on each `send()`.
   *
   * ⚠️ **Untrusted** model output — steerable by prompt injection, poisoned
   * RAG, or echoed tool results. Render it as plain text, or sanitize it (and
   * scheme-allowlist any links) before rendering as HTML/markdown. Never pass
   * it to `dangerouslySetInnerHTML` unsanitized.
   */
  readonly content: string;
  /** The new/continued conversation id, once the first frame arrives. */
  readonly conversationId: ConversationId | null;
  /** Suggested deep-link actions streamed for this turn. Never auto-invoke. */
  readonly suggestedActions: readonly SuggestedActionResponse[];
  /**
   * A clarifying question that blocked the turn, or `null`. When set, render
   * its options; the chosen `value ?? label` becomes the next `send()` message.
   */
  readonly clarification: ClarificationResponse | null;
  /** Token usage for the turn, or `null` until the `usage` frame arrives. */
  readonly usage: ChatStreamUsage | null;
  /** Whether a stream is currently active. */
  readonly isStreaming: boolean;
  /** Error from the last stream attempt, or `null`. */
  readonly error: Error | null;
  /** Start a new turn. Aborts any in-progress stream first. */
  readonly send: (request: SendMessageRequest) => void;
  /** Abort the current stream (stop button / unmount). */
  readonly abort: () => void;
}

/**
 * Streams an agentic chat turn over Server-Sent Events
 * (`POST /conversations/messages`).
 *
 * Accumulates `delta` content into `content`, captures the conversation id,
 * suggested actions, a clarification, and token usage as their frames arrive.
 * Each `send()` resets per-turn state and cancels any in-progress stream. On
 * successful completion the conversation list and the affected detail query are
 * invalidated so the persisted messages refresh.
 *
 * @example
 * ```tsx
 * const { content, isStreaming, send } = useChatStream();
 * send({ message: 'What changed on invoice 42?', promptRefs: [briefId] });
 * <p aria-live="polite">{content}</p>
 * ```
 */
export function useChatStream(): UseChatStreamReturn {
  const config = useAIChatConfig();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [conversationId, setConversationId] = useState<ConversationId | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<readonly SuggestedActionResponse[]>([]);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [usage, setUsage] = useState<ChatStreamUsage | null>(null);
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
    (request: SendMessageRequest) => {
      abort();
      setContent('');
      setConversationId(null);
      setSuggestedActions([]);
      setClarification(null);
      setUsage(null);
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        let resolvedId: ConversationId | null = null;
        try {
          let accumulated = '';
          for await (const event of streamConversationMessage(
            config.client,
            config.basePath,
            request,
            controller.signal
          )) {
            applyEvent(event, {
              appendContent: (chunk) => {
                accumulated += chunk;
                setContent(accumulated);
              },
              setConversationId: (id) => {
                resolvedId = id;
                setConversationId(id);
              },
              setSuggestedActions,
              setClarification,
              setUsage,
            });
          }

          queryClient
            .invalidateQueries({ queryKey: conversationKeys.list(config.queryKeyPrefix) })
            .catch(() => undefined);
          if (resolvedId) {
            queryClient
              .invalidateQueries({
                queryKey: conversationKeys.detail(config.queryKeyPrefix, resolvedId),
              })
              .catch(() => undefined);
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
    [abort, config, queryClient]
  );

  return {
    content,
    conversationId,
    suggestedActions,
    clarification,
    usage,
    isStreaming,
    error,
    send,
    abort,
  };
}

/** Per-frame state updaters, kept out of the hook body for readability. */
interface EventSinks {
  readonly appendContent: (chunk: string) => void;
  readonly setConversationId: (id: ConversationId) => void;
  readonly setSuggestedActions: (actions: readonly SuggestedActionResponse[]) => void;
  readonly setClarification: (clarification: ClarificationResponse) => void;
  readonly setUsage: (usage: ChatStreamUsage) => void;
}

/** Dispatch a single {@link ChatStreamEvent} to the matching state updater. */
function applyEvent(event: ChatStreamEvent, sinks: EventSinks): void {
  switch (event.type) {
    case CHAT_STREAM_EVENT_TYPES.DELTA:
      if (event.content) sinks.appendContent(event.content);
      break;
    case CHAT_STREAM_EVENT_TYPES.CONVERSATION:
      if (event.conversationId) sinks.setConversationId(event.conversationId);
      break;
    case CHAT_STREAM_EVENT_TYPES.SUGGESTIONS:
      if (event.suggestedActions) sinks.setSuggestedActions(event.suggestedActions);
      break;
    case CHAT_STREAM_EVENT_TYPES.CLARIFICATION:
      if (event.clarification) sinks.setClarification(event.clarification);
      break;
    case CHAT_STREAM_EVENT_TYPES.USAGE:
      sinks.setUsage({
        inputTokens: event.inputTokens ?? 0,
        outputTokens: event.outputTokens ?? 0,
      });
      break;
  }
}
