import { cn } from '@granit/utils';

import { useStickToBottom } from '../hooks/use-stick-to-bottom';

import { ScrollToBottomButton } from './scroll-to-bottom-button';

import type { ReactNode } from 'react';

export interface ConversationScrollAreaProps {
  /** The conversation content — typically a `ConversationThread`. */
  readonly children: ReactNode;
  /**
   * Distance (px) from the bottom within which auto-stick stays engaged.
   * @see UseStickToBottomOptions.threshold
   */
  readonly threshold?: number;
  /** Accessible label for the scroll-to-latest button. */
  readonly scrollButtonLabel?: string;
  /** Class for the outer (positioned) wrapper — set the height here. */
  readonly className?: string;
  /** Class for the inner scroll viewport. */
  readonly viewportClassName?: string;
}

/**
 * Batteries-included scroll container for a conversation: owns the scroller,
 * keeps the view pinned to the latest message while streaming, and overlays a
 * {@link ScrollToBottomButton} when the user has scrolled up. Opt-in — the
 * headless `ConversationThread` stays layout-agnostic; reach for the
 * {@link useStickToBottom} hook directly to wire your own scroller instead.
 *
 * Give the outer element a height (e.g. `className="h-full"` or `flex-1`).
 */
export function ConversationScrollArea({
  children,
  threshold,
  scrollButtonLabel,
  className,
  viewportClassName,
}: Readonly<ConversationScrollAreaProps>) {
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom({ threshold });

  return (
    <div
      data-slot="conversation-scroll-area"
      className={cn('relative flex min-h-0 flex-col', className)}
    >
      <div
        ref={scrollRef}
        data-slot="scroll-viewport"
        className={cn('min-h-0 flex-1 overflow-y-auto', viewportClassName)}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <ScrollToBottomButton
          visible={!isAtBottom}
          onClick={() => {
            scrollToBottom();
          }}
          label={scrollButtonLabel}
          className="pointer-events-auto"
        />
      </div>
    </div>
  );
}
