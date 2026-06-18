import { cn } from '@granit/utils';

import { defaultChatLabels } from '../locales/index';

import { ChatMessage } from './chat-message';
import { ToolActivity } from './tool-activity';

import type { ToolCallActivity } from '../hooks/use-chat-stream';
import type { ChatTranslations } from '../locales/index';
import type { MessageResponse } from '@granit/ai-chat';
import type { ReactNode } from 'react';

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
  readonly labels?: ChatTranslations['Thread'];
  readonly toolLabels?: ChatTranslations['Tools'];
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
  labels = defaultChatLabels.Thread,
  toolLabels = defaultChatLabels.Tools,
  className,
}: Readonly<ConversationThreadProps>) {
  const isEmpty = messages.length === 0 && !streamingContent && !isStreaming;
  const hasToolActivity = toolCalls.length > 0 || isThinking;

  return (
    <div
      data-slot="conversation-thread"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className={cn('flex flex-col gap-3', className)}
    >
      {isEmpty ? (
        <p data-slot="thread-empty" className="text-muted-foreground py-8 text-center text-sm">
          {labels.Empty}
        </p>
      ) : null}

      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          authorLabel={message.role === 'user' ? labels.You : labels.Assistant}
          actions={renderMessageActions?.(message, index)}
        />
      ))}

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
    </div>
  );
}
