import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConversationScrollArea } from '../components/conversation-scroll-area';
import { ScrollToBottomButton } from '../components/scroll-to-bottom-button';
import { useStickToBottom } from '../hooks/use-stick-to-bottom';

/** Override jsdom's always-0 layout getters for one element. */
function setMetrics(el: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
}

function Harness() {
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();
  return (
    <div>
      <span data-testid="at-bottom">{String(isAtBottom)}</span>
      <button type="button" onClick={() => scrollToBottom('auto')}>
        go
      </button>
      <div data-testid="viewport" ref={scrollRef}>
        <div ref={contentRef}>content</div>
      </div>
    </div>
  );
}

describe('useStickToBottom', () => {
  it('flips isAtBottom as the user scrolls away from and back to the bottom', () => {
    render(<Harness />);
    const viewport = screen.getByTestId('viewport');
    const atBottom = screen.getByTestId('at-bottom');

    // Starts pinned.
    expect(atBottom).toHaveTextContent('true');

    // Tall content, scrolled to the top → not at bottom.
    setMetrics(viewport, 1000, 300);
    viewport.scrollTop = 0;
    fireEvent.scroll(viewport);
    expect(atBottom).toHaveTextContent('false');

    // Scrolled to the bottom → at bottom again.
    viewport.scrollTop = 700;
    fireEvent.scroll(viewport);
    expect(atBottom).toHaveTextContent('true');
  });

  it('scrollToBottom moves the viewport to the end and re-engages stick', async () => {
    render(<Harness />);
    const viewport = screen.getByTestId('viewport');
    const atBottom = screen.getByTestId('at-bottom');

    setMetrics(viewport, 1000, 300);
    viewport.scrollTop = 0;
    fireEvent.scroll(viewport);
    expect(atBottom).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'go' }));

    expect(viewport.scrollTop).toBe(1000);
    expect(atBottom).toHaveTextContent('true');
  });
});

describe('ScrollToBottomButton', () => {
  it('is interactive and labelled when visible', async () => {
    const onClick = vi.fn();
    render(<ScrollToBottomButton visible onClick={onClick} />);

    const button = screen.getByRole('button', { name: /scroll to latest/i });
    expect(button).toHaveAttribute('data-slot', 'scroll-to-bottom');
    expect(button).toHaveAttribute('aria-hidden', 'false');
    expect(button).toHaveAttribute('tabindex', '0');

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is hidden from the a11y tree and the tab order when not visible', () => {
    render(<ScrollToBottomButton visible={false} onClick={vi.fn()} label="Down" />);
    const button = screen.getByLabelText('Down');
    expect(button).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(button.className).toContain('pointer-events-none');
  });
});

describe('ConversationScrollArea', () => {
  it('renders children in a scroll viewport with the overlay button', () => {
    const { container } = render(
      <ConversationScrollArea>
        <p>message body</p>
      </ConversationScrollArea>
    );

    expect(container.querySelector('[data-slot="conversation-scroll-area"]')).toBeInTheDocument();
    const viewport = container.querySelector('[data-slot="scroll-viewport"]');
    expect(viewport).toHaveClass('overflow-y-auto');
    expect(screen.getByText('message body')).toBeInTheDocument();

    // Pinned at mount → the button is present but hidden from the a11y tree.
    const button = container.querySelector('[data-slot="scroll-to-bottom"]');
    expect(button).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('aria-label', 'Scroll to latest');
  });
});
