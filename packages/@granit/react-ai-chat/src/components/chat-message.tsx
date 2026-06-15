import { cn } from '@granit/utils';

import type { ChatMessageRole } from '@granit/ai-chat';

export interface ChatMessageProps {
  readonly role: ChatMessageRole;
  /**
   * Message text. ⚠️ **Untrusted** for assistant messages — rendered here as a
   * plain text node (React escapes it). Never replace this with an HTML sink.
   */
  readonly content: string;
  /** Localised author label (e.g. "You" / "Assistant"). */
  readonly authorLabel?: string;
  readonly className?: string;
}

/** A single chat bubble. Aligns right for the user, left for the assistant. */
export function ChatMessage({ role, content, authorLabel, className }: Readonly<ChatMessageProps>) {
  const isUser = role === 'user';
  return (
    <div
      data-slot="chat-message"
      data-role={role}
      className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start', className)}
    >
      {authorLabel ? (
        <span className="text-muted-foreground text-xs font-medium">{authorLabel}</span>
      ) : null}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {content}
      </div>
    </div>
  );
}
