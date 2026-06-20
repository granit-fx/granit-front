import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatMessage } from '../components/chat-message';

describe('ChatMessage — user chip markers', () => {
  it('renders bold chip markers as inline pills, keeping the surrounding text', () => {
    const { container } = render(
      <ChatMessage
        role="user"
        content="Fait moi un **/Daily brief** sur **@United Airlines** précise."
      />
    );

    const chips = container.querySelectorAll('[data-slot="message-chip"]');
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveAttribute('data-kind', 'prompt');
    expect(chips[0]).toHaveTextContent('Daily brief');
    expect(chips[1]).toHaveAttribute('data-kind', 'mention');
    expect(chips[1]).toHaveTextContent('United Airlines');

    // The markers themselves never leak into the rendered text.
    const bubble = container.querySelector('[data-slot="chat-bubble"]');
    expect(bubble?.textContent).toBe('Fait moi un Daily brief sur United Airlines précise.');
    expect(bubble?.textContent).not.toContain('**');
  });

  it('renders a plain user message unchanged with no chips', () => {
    const { container } = render(<ChatMessage role="user" content="just a message" />);
    expect(screen.getByText('just a message')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="message-chip"]')).toBeNull();
  });
});
