import { cn } from '@granit/utils';
import { Loader2 } from 'lucide-react';

import { defaultChatLabels, defaultErrorLabels } from '../locales/index';
import { useOptionalAIChatConfig } from '../providers/ai-chat-provider';

import { ChatMessage } from './chat-message';
import { MessageMetrics } from './message-metrics';
import { SystemMessage } from './system-message';
import { ToolActivity } from './tool-activity';

import type { ChatErrorKind, ChatTurnMetrics, ToolCallActivity } from '../hooks/use-chat-stream';
import type { ChatTranslations } from '../locales/index';
import type { MessageResponse } from '@granit/ai-chat';
import type { ReactNode, Ref } from 'react';

/** Resolve the user-facing message for an error kind, falling back to English. */
function errorMessage(kind: ChatErrorKind, labels: ChatTranslations['Errors']): string {
  const e = labels ?? defaultErrorLabels;
  switch (kind) {
    case 'rate-limit':
      return e.RateLimit;
    case 'server':
      return e.Server;
    case 'network':
      return e.Network;
    default:
      return e.Unknown;
  }
}

export interface ConversationThreadProps {
  /** Persisted messages, oldest first. */
  readonly messages: readonly MessageResponse[];
  /**
   * Live assistant text for the in-flight turn (from `useChatStream().content`).
   * ⚠️ Untrusted — rendered as plain text.
   */
  readonly streamingContent?: string;
  /** Whether a turn is currently streaming (drives the typing indicator). */
  readonly isStreaming?: boolean;
  /** Live tool activity for the in-flight turn (from `useChatStream().toolCalls`). */
  readonly toolCalls?: readonly ToolCallActivity[];
  /** Derived "thinking" indicator for the in-flight turn (`useChatStream().isThinking`). */
  readonly isThinking?: boolean;
  /** Map a backend tool name to its display label (passed to {@link ToolActivity}). */
  readonly resolveToolLabel?: (toolName: string) => string;
  /**
   * Render a generic action slot for each persisted message (e.g. copy /
   * regenerate / report). The returned node is passed to {@link ChatMessage}'s
   * `actions` slot. Not invoked for the in-flight streaming bubble or the typing
   * indicator, whose content is not yet finalised.
   */
  readonly renderMessageActions?: (message: MessageResponse, index: number) => ReactNode;
  /**
   * Reverse infinite scroll — a forwarded ref to the zero-height top sentinel
   * rendered above the messages. Pass the same ref to {@link useReverseInfiniteScroll}'s
   * `topSentinelRef` so it can observe scroll-up and load older messages. When
   * omitted (and {@link hasMoreOlder}/{@link isLoadingOlder} unset), the thread
   * behaves exactly as before — no sentinel, no spinner.
   */
  readonly topSentinelRef?: Ref<HTMLDivElement>;
  /** Whether older messages remain to load — renders the sentinel when `true`. */
  readonly hasMoreOlder?: boolean;
  /** Whether an older page is loading — renders a spinner row at the top. */
  readonly isLoadingOlder?: boolean;
  /**
   * The classified failure of the current turn (`useChatStream().errorKind`).
   * When set, a {@link SystemMessage} is rendered after the messages with a
   * localized message and, if {@link onRetry} is given, a retry button.
   */
  readonly errorKind?: ChatErrorKind | null;
  /** Invoked by the error notice's retry button; omit to hide it. */
  readonly onRetry?: () => void;
  /**
   * Client-side timing for the last completed turn (from `useChatStream().metrics`).
   * Shown as a chip under the latest assistant message only when the provider's
   * `showMessageMetrics` is enabled; ignored otherwise.
   */
  readonly metrics?: ChatTurnMetrics | null;
  readonly labels?: ChatTranslations['Thread'];
  readonly toolLabels?: ChatTranslations['Tools'];
  /** Localized error copy; defaults to the bundled English strings. */
  readonly errorLabels?: NonNullable<ChatTranslations['Errors']>;
  readonly metricsLabels?: ChatTranslations['Metrics'];
  readonly className?: string;
}

/**
 * Renders a conversation: the persisted messages plus the live streaming
 * assistant bubble. The streaming region is an ARIA live region
 * (`role="log"`, `aria-live="polite"`) so screen readers announce incremental
 * text. The typing indicator honours `prefers-reduced-motion` (the framework's
 * base stylesheet neutralises the animation).
 */
export function ConversationThread({
  messages,
  streamingContent,
  isStreaming = false,
  toolCalls = [],
  isThinking = false,
  resolveToolLabel,
  renderMessageActions,
  topSentinelRef,
  hasMoreOlder,
  isLoadingOlder = false,
  errorKind,
  onRetry,
  metrics,
  labels = defaultChatLabels.Thread,
  toolLabels = defaultChatLabels.Tools,
  errorLabels = defaultChatLabels.Errors,
  metricsLabels = defaultChatLabels.Metrics,
  className,
}: Readonly<ConversationThreadProps>) {
  const isEmpty = messages.length === 0 && !streamingContent && !isStreaming && !errorKind;
  const hasToolActivity = toolCalls.length > 0 || isThinking;
  // Render the scroll-up paging affordances only when the host opted in.
  const isPaged = topSentinelRef !== undefined || hasMoreOlder !== undefined;

  // Per-message metrics are an opt-in (provider flag) and only meaningful once a
  // turn has finished streaming. Attach the chip to the most recent assistant
  // reply — the one the current `metrics` describes.
  const showMetrics = (useOptionalAIChatConfig()?.showMessageMetrics ?? false) && metrics != null;
  const lastAssistantIndex = showMetrics
    ? messages.findLastIndex((message) => message.role === 'assistant')
    : -1;

  return (
    <div
      data-slot="conversation-thread"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className={cn('flex flex-col gap-3', className)}
    >
      {isPaged ? (
        <div ref={topSentinelRef} data-slot="thread-top-sentinel" aria-hidden className="h-px" />
      ) : null}

      {isLoadingOlder ? (
        <div
          data-slot="thread-loading-older"
          className="text-muted-foreground flex items-center justify-center gap-1.5 py-1 text-xs"
          aria-label={labels.LoadingOlder ?? defaultChatLabels.Thread.LoadingOlder}
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {labels.LoadingOlder ?? defaultChatLabels.Thread.LoadingOlder}
        </div>
      ) : null}

      {isEmpty ? (
        <p data-slot="thread-empty" className="text-muted-foreground py-8 text-center text-sm">
          {labels.Empty}
        </p>
      ) : null}

      {messages.map((message, index) => {
        const hostActions = renderMessageActions?.(message, index);
        const metricsChip =
          showMetrics && metrics && index === lastAssistantIndex ? (
            <MessageMetrics metrics={metrics} labels={metricsLabels} />
          ) : null;
        const actions =
          hostActions || metricsChip ? (
            <>
              {hostActions}
              {metricsChip}
            </>
          ) : undefined;
        return (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            authorLabel={message.role === 'user' ? labels.You : labels.Assistant}
            actions={actions}
          />
        );
      })}

      {hasToolActivity ? (
        <ToolActivity
          toolCalls={toolCalls}
          isThinking={isThinking}
          labels={toolLabels}
          resolveToolLabel={resolveToolLabel}
        />
      ) : null}

      {streamingContent ? (
        <ChatMessage role="assistant" content={streamingContent} authorLabel={labels.Assistant} />
      ) : null}

      {isStreaming && !streamingContent && !hasToolActivity ? (
        <div
          data-slot="thread-typing"
          className="text-muted-foreground flex items-center gap-1 text-sm"
          aria-label={labels.AssistantTyping}
        >
          <span className="bg-muted-foreground size-1.5 animate-pulse rounded-full" aria-hidden />
          <span
            className="bg-muted-foreground size-1.5 animate-pulse rounded-full [animation-delay:150ms]"
            aria-hidden
          />
          <span
            className="bg-muted-foreground size-1.5 animate-pulse rounded-full [animation-delay:300ms]"
            aria-hidden
          />
        </div>
      ) : null}

      {errorKind ? (
        <SystemMessage
          variant="error"
          action={
            onRetry ? (
              <button
                type="button"
                data-slot="thread-retry"
                onClick={onRetry}
                className="hover:bg-destructive/10 rounded-md px-2 py-1 text-xs font-medium underline-offset-2 hover:underline"
              >
                {errorLabels?.Retry ?? defaultErrorLabels.Retry}
              </button>
            ) : null
          }
        >
          {errorMessage(errorKind, errorLabels)}
        </SystemMessage>
      ) : null}
    </div>
  );
}
