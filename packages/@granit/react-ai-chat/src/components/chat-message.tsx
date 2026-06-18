import { cn } from '@granit/utils';

import type { ChatMessageRole } from '@granit/ai-chat';
import type { CSSProperties, ReactNode } from 'react';

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
  // Flatten the emitter-side bottom corner into a speech-bubble tail. Done
  // inline rather than with per-corner Tailwind utilities: those classes are
  // novel here and get purged by the consuming app's Tailwind scan, whereas an
  // inline style always renders and reliably wins over the `rounded-2xl` base.
  const tailStyle: CSSProperties = isUser
    ? { borderBottomRightRadius: 0 }
    : { borderBottomLeftRadius: 0 };
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
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground'
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
