import { cn } from '@granit/utils';

import { defaultChatLabels } from '../locales/index';

import { ChatMessage } from './chat-message';

import type { ChatTranslations } from '../locales/index';
import type { MessageResponse } from '@granit/ai-chat';

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
  readonly labels?: ChatTranslations['Thread'];
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
  labels = defaultChatLabels.Thread,
  className,
}: Readonly<ConversationThreadProps>) {
  const isEmpty = messages.length === 0 && !streamingContent && !isStreaming;

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

      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          authorLabel={message.role === 'user' ? labels.You : labels.Assistant}
        />
      ))}

      {streamingContent ? (
        <ChatMessage role="assistant" content={streamingContent} authorLabel={labels.Assistant} />
      ) : null}

      {isStreaming && !streamingContent ? (
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
