import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { ConversationThread } from '../components/conversation-thread';

import type { MessageResponse } from '@granit/ai-chat';

const messages: MessageResponse[] = [
  {
    id: 'm1' as MessageResponse['id'],
    role: 'user',
    content: 'Hello',
    createdAt: '2026-06-15T09:00:00Z' as MessageResponse['createdAt'],
  },
  {
    id: 'm2' as MessageResponse['id'],
    role: 'assistant',
    content: 'Hi there',
    createdAt: '2026-06-15T09:00:02Z' as MessageResponse['createdAt'],
  },
];

describe('ConversationThread — reverse pagination', () => {
  it('renders and forwards a ref to the top sentinel when paging is wired', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ConversationThread messages={messages} topSentinelRef={ref} hasMoreOlder />
    );
    const sentinel = container.querySelector('[data-slot="thread-top-sentinel"]');
    expect(sentinel).toBeInTheDocument();
    expect(ref.current).toBe(sentinel);
  });

  it('shows the loading-older row only while an older page is fetching', () => {
    const { container, rerender } = render(
      <ConversationThread messages={messages} hasMoreOlder isLoadingOlder={false} />
    );
    expect(container.querySelector('[data-slot="thread-loading-older"]')).not.toBeInTheDocument();

    rerender(<ConversationThread messages={messages} hasMoreOlder isLoadingOlder />);
    const row = container.querySelector('[data-slot="thread-loading-older"]');
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute('aria-label', 'Loading older messages…');
  });

  it('stays backward compatible: no sentinel or spinner without paging props', () => {
    const { container } = render(<ConversationThread messages={messages} />);
    expect(container.querySelector('[data-slot="thread-top-sentinel"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="thread-loading-older"]')).not.toBeInTheDocument();
  });
});
