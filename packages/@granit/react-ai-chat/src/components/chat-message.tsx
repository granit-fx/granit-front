import { cn } from '@granit/utils';

import { ChatMarkdown } from './chat-markdown';
import { tokenizeMessageContent } from './composer-content';

import type { ChatMessageRole } from '@granit/ai-chat';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Render a user message, turning the chip markers the composer left in the text
 * (bold `@…`/slash-`…` runs like `**@United Airlines**`) back into inline pills.
 * Plain runs stay verbatim; nothing here is an HTML sink (text + spans only).
 */
function UserContent({ content }: { readonly content: string }): ReactNode {
  return tokenizeMessageContent(content).map((segment, index) =>
    segment.type === 'text' ? (
      <span key={`t${index}`}>{segment.value}</span>
    ) : (
      <span
        key={`c${index}`}
        data-slot="message-chip"
        data-kind={segment.kind}
        className="bg-primary-foreground/15 mx-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 align-baseline font-medium"
      >
        {segment.label}
      </span>
    )
  );
}

export interface ChatMessageProps {
  readonly role: ChatMessageRole;
  /**
   * Message text. ⚠️ **Untrusted** for assistant messages — rendered via
   * {@link ChatMarkdown} as an escaped React element tree (`react-markdown`, no
   * `rehype-raw`), so it stays Markdown-formatted without becoming an HTML sink.
   * User messages stay verbatim plain text. Never replace this with an HTML sink.
   */
  readonly content: string;
  /** Localised author label (e.g. "You" / "Assistant"). */
  readonly authorLabel?: string;
  /**
   * Generic per-message action slot rendered in a row under the bubble (e.g.
   * copy / regenerate / report). The framework stays action-agnostic — the host
   * app supplies the controls. Hidden until the message is hovered or focused.
   */
  readonly actions?: ReactNode;
  readonly className?: string;
}

/** A single chat bubble. Aligns right for the user, left for the assistant. */
export function ChatMessage({
  role,
  content,
  authorLabel,
  actions,
  className,
}: Readonly<ChatMessageProps>) {
  const isUser = role === 'user';
  // Flatten the emitter-side top corner into a speech-bubble tail. Done
  // inline rather than with per-corner Tailwind utilities: those classes are
  // novel here and get purged by the consuming app's Tailwind scan, whereas an
  // inline style always renders and reliably wins over the `rounded-2xl` base.
  const tailStyle: CSSProperties = isUser
    ? { borderTopRightRadius: 0 }
    : { borderTopLeftRadius: 0 };
  return (
    <div
      data-slot="chat-message"
      data-role={role}
      className={cn('group flex flex-col gap-1', isUser ? 'items-end' : 'items-start', className)}
    >
      {authorLabel ? (
        <span className="text-muted-foreground text-xs font-medium">{authorLabel}</span>
      ) : null}
      <div
        data-slot="chat-bubble"
        style={tailStyle}
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
          // Preserve authored whitespace only for the verbatim user branch; the
          // assistant branch is laid out by ChatMarkdown's block elements.
          isUser
            ? 'bg-primary text-primary-foreground whitespace-pre-wrap'
            : 'bg-muted/20 text-foreground'
        )}
      >
        {isUser ? <UserContent content={content} /> : <ChatMarkdown content={content} />}
      </div>
      {actions ? (
        <div
          data-slot="chat-message-actions"
          className={cn(
            'flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100',
            isUser ? 'items-end' : 'items-start'
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
