import { cn } from '@granit/utils';

import type { ChatMessageRole } from '@granit/ai-chat';
import type { ReactNode } from 'react';

export interface ChatMessageProps {
  readonly role: ChatMessageRole;
  /**
   * Message text. ⚠️ **Untrusted** for assistant messages — rendered here as a
   * plain text node (React escapes it). Never replace this with an HTML sink.
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
        className={cn(
          // Per-corner radii only — mixing the `rounded-2xl` shorthand with a
          // single-corner override lets the shorthand reset the tail corner.
          // The emitter-side bottom corner is left at the default 0 (the tail).
          'max-w-[80%] rounded-tl-2xl rounded-tr-2xl px-3 py-2 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-bl-2xl'
            : 'bg-muted/50 text-foreground rounded-br-2xl'
        )}
      >
        {content}
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
