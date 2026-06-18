import {
  CHAT_STREAM_ERROR_CODES,
  CHAT_STREAM_EVENT_TYPES,
  streamConversationMessage,
} from '@granit/ai-chat';
import { createLogger } from '@granit/logger';
import { toEntityId, toISODateString } from '@granit/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

const logger = createLogger('react-ai-chat');

import type { MessagesPageParam } from './use-conversation-messages';
import type {
  ChatStreamEvent,
  ClarificationResponse,
  ConversationId,
  MessagePage,
  MessageResponse,
  SendMessageRequest,
  SuggestedActionResponse,
} from '@granit/ai-chat';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

/** Token usage reported near the end of a turn. */
export interface ChatStreamUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/**
 * The kind of a failed turn, for picking a user-facing message:
 * - `rate-limit` — quota / rate limit hit (HTTP 429 or an `error` frame with
 *   `rate_limit`); typically "try again shortly".
 * - `server` — a server/provider failure (HTTP 5xx, or an `error` frame with
 *   `provider_unavailable` / `server_error`).
 * - `network` — the request never reached the server (offline, transport fault).
 * - `unknown` — anything else.
 */
export type ChatErrorKind = 'rate-limit' | 'server' | 'network' | 'unknown';

/** Map an `error`-frame {@link CHAT_STREAM_ERROR_CODES} code to a {@link ChatErrorKind}. */
function codeToErrorKind(code: string | null | undefined): ChatErrorKind {
  switch (code) {
    case CHAT_STREAM_ERROR_CODES.RATE_LIMIT:
      return 'rate-limit';
    case CHAT_STREAM_ERROR_CODES.PROVIDER_UNAVAILABLE:
    case CHAT_STREAM_ERROR_CODES.SERVER_ERROR:
      return 'server';
    default:
      return 'unknown';
  }
}

/**
 * Classify a thrown stream error (pre-stream HTTP problem or transport fault)
 * without an Axios import: read the HTTP status when present, else treat the
 * absence of a response as a network failure.
 */
function classifyThrownError(err: unknown): ChatErrorKind {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (typeof status === 'number') {
    if (status === 429) return 'rate-limit';
    if (status >= 500) return 'server';
    return 'unknown';
  }
  return 'network';
}

/** Lifecycle of a single tool invocation within a turn. */
export type ToolCallStatus = 'running' | 'succeeded' | 'failed';

/**
 * The live state of one tool the agent invoked this turn, keyed by
 * `toolCallId`. Starts `running` on the `tool_call` frame and resolves to
 * `succeeded`/`failed` on the matching `tool_result`. Carries only the tool's
 * name (never its arguments or result) — map `toolName` to a localized label.
 */
export interface ToolCallActivity {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly status: ToolCallStatus;
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
  /**
   * Tools the agent invoked this turn, in the order they started, each keyed by
   * `toolCallId`. Render as chips (spinner while `running`, ✓/✗ once resolved).
   * Reset on each `send()`.
   */
  readonly toolCalls: readonly ToolCallActivity[];
  /**
   * Derived "thinking" indicator: `true` once a `tool_result` has arrived but no
   * `delta` has followed yet (the agent is deciding its next step). Cleared by
   * the next `delta` or `tool_call`. There is no `thinking` frame on the wire.
   */
  readonly isThinking: boolean;
  /** Token usage for the turn, or `null` until the `usage` frame arrives. */
  readonly usage: ChatStreamUsage | null;
  /** Whether a stream is currently active. */
  readonly isStreaming: boolean;
  /** Error from the last stream attempt, or `null`. */
  readonly error: Error | null;
  /**
   * Classified kind of the last error, or `null`. Covers both a pre-stream HTTP
   * problem / transport fault and a terminal mid-stream `error` frame. Use it to
   * pick a user-facing message (e.g. via `ConversationThread`'s `errorKind`).
   */
  readonly errorKind: ChatErrorKind | null;
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
/**
 * Append a finished turn (the user message + the assistant's accumulated answer)
 * to the NEWEST page of the messages infinite query, in place. No-op when the
 * query isn't loaded — the next mount fetches the turn from the server instead.
 *
 * ⚠️ The SSE contract carries no persisted message ids, so the appended rows get
 * client-synthesized ids/timestamps for instant display. They are replaced by the
 * authoritative server rows on the next full load of the messages query. A
 * backend follow-up emitting final ids on the stream would let this append real
 * ids (and make the freshly-streamed message reportable immediately).
 */
function appendTurnToMessages(
  queryClient: QueryClient,
  key: readonly unknown[],
  userMessage: string,
  assistantContent: string
): void {
  queryClient.setQueryData<InfiniteData<MessagePage, MessagesPageParam>>(key, (prev) => {
    const newest = prev?.pages[0];
    if (!prev || !newest) return prev;
    const now = toISODateString(new Date().toISOString());
    const synth = (role: MessageResponse['role'], content: string): MessageResponse => ({
      id: toEntityId<'Message'>(crypto.randomUUID()),
      role,
      content,
      createdAt: now,
    });
    const appended: MessageResponse[] = [synth('user', userMessage)];
    if (assistantContent) appended.push(synth('assistant', assistantContent));
    // pages[0] is the initial (newest) page; its items are ascending, so the
    // new turn goes at the end of that page.
    const updatedNewest: MessagePage = { ...newest, items: [...newest.items, ...appended] };
    return { ...prev, pages: [updatedNewest, ...prev.pages.slice(1)] };
  });
}

export function useChatStream(): UseChatStreamReturn {
  const config = useAIChatConfig();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [conversationId, setConversationId] = useState<ConversationId | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<readonly SuggestedActionResponse[]>([]);
  const [clarification, setClarification] = useState<ClarificationResponse | null>(null);
  const [toolCalls, setToolCalls] = useState<readonly ToolCallActivity[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [usage, setUsage] = useState<ChatStreamUsage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorKind, setErrorKind] = useState<ChatErrorKind | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // Abort any in-flight stream when the consumer unmounts, so the SSE request is
  // released instead of running to completion against a gone component.
  useEffect(() => abort, [abort]);

  const send = useCallback(
    (request: SendMessageRequest) => {
      abort();
      setContent('');
      setConversationId(null);
      setSuggestedActions([]);
      setClarification(null);
      setToolCalls([]);
      setIsThinking(false);
      setUsage(null);
      setError(null);
      setErrorKind(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const turn: TurnState = {
        accumulated: '',
        tools: [],
        thinking: false,
        resolvedId: null,
        errorCode: null,
      };
      const sinks = createEventSinks(turn, {
        setContent,
        setConversationId,
        setSuggestedActions,
        setClarification,
        setUsage,
        setToolCalls,
        setIsThinking,
        setError,
        setErrorKind,
      });

      void (async () => {
        try {
          for await (const event of streamConversationMessage(
            config.client,
            config.basePath,
            request,
            controller.signal
          )) {
            applyEvent(event, sinks);
          }

          if (turn.resolvedId) {
            // Optimistically push the finished turn onto the newest page of the
            // messages infinite query, so it appears without a refetch and
            // without resetting any older pages the user has loaded.
            appendTurnToMessages(
              queryClient,
              conversationKeys.messages(config.queryKeyPrefix, turn.resolvedId),
              request.message,
              turn.accumulated
            );
            // Refresh conversation metadata (title may have been auto-generated)
            // — `exact` so the nested `messages` key is NOT invalidated, which
            // would otherwise re-fetch every loaded page and undo the append.
            queryClient
              .invalidateQueries({
                queryKey: conversationKeys.detail(config.queryKeyPrefix, turn.resolvedId),
                exact: true,
              })
              .catch(() => undefined);
          }
          // Sidebar ordering / titles.
          queryClient
            .invalidateQueries({ queryKey: conversationKeys.list(config.queryKeyPrefix) })
            .catch(() => undefined);
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          logger.error('Chat stream turn failed', err, { conversationId: turn.resolvedId });
          setError(err instanceof Error ? err : new Error(String(err)));
          setErrorKind(classifyThrownError(err));
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
    toolCalls,
    isThinking,
    usage,
    isStreaming,
    error,
    errorKind,
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
  readonly startToolCall: (toolCallId: string, toolName: string) => void;
  readonly resolveToolCall: (toolCallId: string, succeeded: boolean) => void;
  readonly setThinking: (thinking: boolean) => void;
  readonly fail: (code: string | null | undefined) => void;
}

/** Mutable accumulators for a single streaming turn, threaded through {@link createEventSinks}. */
interface TurnState {
  accumulated: string;
  tools: readonly ToolCallActivity[];
  thinking: boolean;
  resolvedId: ConversationId | null;
  errorCode: string | null;
}

/** React state setters the sinks dispatch to. */
interface EventSinkSetters {
  readonly setContent: (value: string) => void;
  readonly setConversationId: (id: ConversationId | null) => void;
  readonly setSuggestedActions: (actions: readonly SuggestedActionResponse[]) => void;
  readonly setClarification: (clarification: ClarificationResponse | null) => void;
  readonly setUsage: (usage: ChatStreamUsage) => void;
  readonly setToolCalls: (tools: readonly ToolCallActivity[]) => void;
  readonly setIsThinking: (thinking: boolean) => void;
  readonly setError: (error: Error | null) => void;
  readonly setErrorKind: (kind: ChatErrorKind | null) => void;
}

/**
 * Build the per-frame {@link EventSinks} bound to a single turn's mutable state —
 * kept out of the hook body so the handlers don't nest under the streaming IIFE.
 */
function createEventSinks(turn: TurnState, setters: EventSinkSetters): EventSinks {
  return {
    appendContent: (chunk) => {
      turn.accumulated += chunk;
      setters.setContent(turn.accumulated);
    },
    setConversationId: (id) => {
      turn.resolvedId = id;
      setters.setConversationId(id);
    },
    setSuggestedActions: setters.setSuggestedActions,
    setClarification: setters.setClarification,
    setUsage: setters.setUsage,
    startToolCall: (toolCallId, toolName) => {
      turn.tools = [...turn.tools, { toolCallId, toolName, status: 'running' }];
      setters.setToolCalls(turn.tools);
    },
    resolveToolCall: (toolCallId, succeeded) => {
      turn.tools = turn.tools.map((tool) =>
        tool.toolCallId === toolCallId
          ? { ...tool, status: succeeded ? 'succeeded' : 'failed' }
          : tool
      );
      setters.setToolCalls(turn.tools);
    },
    setThinking: (next) => {
      if (next !== turn.thinking) {
        turn.thinking = next;
        setters.setIsThinking(next);
      }
    },
    fail: (code) => {
      turn.errorCode = code ?? CHAT_STREAM_ERROR_CODES.SERVER_ERROR;
      setters.setError(new Error(`Chat stream failed: ${turn.errorCode}`));
      setters.setErrorKind(codeToErrorKind(turn.errorCode));
    },
  };
}

/** Dispatch a single {@link ChatStreamEvent} to the matching state updater. */
function applyEvent(event: ChatStreamEvent, sinks: EventSinks): void {
  switch (event.type) {
    case CHAT_STREAM_EVENT_TYPES.DELTA:
      if (event.content) sinks.appendContent(event.content);
      // Streamed text resumed — the agent is no longer between steps.
      sinks.setThinking(false);
      break;
    case CHAT_STREAM_EVENT_TYPES.CONVERSATION:
      if (event.conversationId) sinks.setConversationId(event.conversationId);
      break;
    case CHAT_STREAM_EVENT_TYPES.TOOL_CALL:
      if (event.toolCallId && event.toolName) {
        sinks.startToolCall(event.toolCallId, event.toolName);
      }
      // A tool is now running; its chip carries the activity, not "thinking".
      sinks.setThinking(false);
      break;
    case CHAT_STREAM_EVENT_TYPES.TOOL_RESULT:
      if (event.toolCallId) sinks.resolveToolCall(event.toolCallId, event.succeeded === true);
      // Result in, next step undecided — show "thinking" until a delta/tool follows.
      sinks.setThinking(true);
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
    case CHAT_STREAM_EVENT_TYPES.ERROR:
      // Terminal failure after the stream committed — record it; the answer so
      // far stays rendered as a partial bubble. Resolving "thinking" avoids a
      // dangling indicator if the agent failed between steps.
      sinks.setThinking(false);
      sinks.fail(event.code);
      break;
  }
}
