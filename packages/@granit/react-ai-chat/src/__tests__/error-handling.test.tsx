import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConversationThread } from '../components/conversation-thread';
import { SystemMessage } from '../components/system-message';

describe('SystemMessage', () => {
  it('announces an error assertively and renders an action slot', async () => {
    const onClick = vi.fn();
    const { container } = render(
      <SystemMessage
        variant="error"
        action={
          <button type="button" onClick={onClick}>
            Retry
          </button>
        }
      >
        Something went wrong.
      </SystemMessage>
    );

    const notice = container.querySelector('[data-slot="system-message"]');
    expect(notice).toHaveAttribute('data-variant', 'error');
    expect(notice).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders info as a polite status', () => {
    const { container } = render(<SystemMessage>Heads up.</SystemMessage>);
    const notice = container.querySelector('[data-slot="system-message"]');
    expect(notice).toHaveAttribute('data-variant', 'info');
    expect(notice).toHaveAttribute('role', 'status');
  });
});

describe('ConversationThread error notice', () => {
  it('renders a localized error message + retry for an errorKind', async () => {
    const onRetry = vi.fn();
    const { container } = render(
      <ConversationThread messages={[]} errorKind="rate-limit" onRetry={onRetry} />
    );

    const notice = container.querySelector('[data-slot="system-message"][data-variant="error"]');
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/rate limit/i);

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    // An error is not the empty state.
    expect(container.querySelector('[data-slot="thread-empty"]')).not.toBeInTheDocument();
  });

  it('omits the retry button when onRetry is not supplied', () => {
    const { container } = render(<ConversationThread messages={[]} errorKind="server" />);
    expect(container.querySelector('[data-slot="system-message"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="thread-retry"]')).not.toBeInTheDocument();
  });

  it('renders no error notice when errorKind is null', () => {
    const { container } = render(<ConversationThread messages={[]} errorKind={null} />);
    expect(container.querySelector('[data-slot="system-message"]')).not.toBeInTheDocument();
  });
});
