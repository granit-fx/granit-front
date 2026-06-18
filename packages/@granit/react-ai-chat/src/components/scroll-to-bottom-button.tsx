import { cn } from '@granit/utils';
import { ArrowDown } from 'lucide-react';

import { defaultChatLabels } from '../locales/index';

export interface ScrollToBottomButtonProps {
  /** Whether the button is shown — typically `!isAtBottom`. */
  readonly visible: boolean;
  /** Jump to the latest message. */
  readonly onClick: () => void;
  /** Accessible label; defaults to the `Thread.ScrollToLatest` translation. */
  readonly label?: string;
  readonly className?: string;
}

/**
 * A circular "scroll to latest" button. Presentational and controlled: pair it
 * with {@link useStickToBottom} (or any scroll state) — pass `visible` and
 * `onClick`. Stays mounted and fades/scales out when hidden so it can animate,
 * and is removed from the tab order and the accessibility tree while hidden.
 */
export function ScrollToBottomButton({
  visible,
  onClick,
  label = defaultChatLabels.Thread.ScrollToLatest ?? 'Scroll to latest',
  className,
}: Readonly<ScrollToBottomButtonProps>) {
  return (
    <button
      type="button"
      data-slot="scroll-to-bottom"
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
      className={cn(
        'border-border bg-background text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full border shadow-md transition-all duration-150 ease-out',
        visible ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        className
      )}
    >
      <ArrowDown className="size-4" aria-hidden />
    </button>
  );
}
