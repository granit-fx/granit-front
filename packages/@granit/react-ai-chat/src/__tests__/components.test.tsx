import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AttachmentChips } from '../components/attachment-chips';
import { ClarificationPrompt } from '../components/clarification-prompt';
import { ConversationThread } from '../components/conversation-thread';
import { SuggestedActions } from '../components/suggested-actions';

import type { ComposerAttachment } from '../components/attachment-chips';
import type {
  ClarificationResponse,
  MessageResponse,
  SuggestedActionResponse,
} from '@granit/ai-chat';

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

describe('ConversationThread', () => {
  it('renders messages inside an ARIA live log region', () => {
    const { container } = render(<ConversationThread messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    const log = container.querySelector('[data-slot="conversation-thread"]');
    expect(log).toHaveAttribute('role', 'log');
    expect(log).toHaveAttribute('aria-live', 'polite');
  });

  it('shows the empty state when there are no messages', () => {
    const { container } = render(<ConversationThread messages={[]} />);
    expect(container.querySelector('[data-slot="thread-empty"]')).toBeInTheDocument();
  });

  it('renders streaming content as a live assistant bubble', () => {
    render(<ConversationThread messages={messages} streamingContent="Streaming…" isStreaming />);
    expect(screen.getByText('Streaming…')).toBeInTheDocument();
  });
});

describe('SuggestedActions', () => {
  const actions: SuggestedActionResponse[] = [
    { type: 'open', label: 'Open invoice', deepLink: '/invoices/42', description: 'View it' },
  ];

  it('emits onSelect on click and never navigates by itself', async () => {
    const onSelect = vi.fn();
    render(<SuggestedActions actions={actions} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /open invoice/i }));
    expect(onSelect).toHaveBeenCalledWith(actions[0]);
  });

  it('renders nothing when there are no actions', () => {
    const { container } = render(<SuggestedActions actions={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ClarificationPrompt', () => {
  const clarification: ClarificationResponse = {
    question: 'Which invoice?',
    options: [
      { label: '#42', value: '42' },
      { label: 'Latest', value: null },
    ],
    allowOther: true,
  };

  it('emits value ?? label when an option is chosen', async () => {
    const onChoose = vi.fn();
    render(<ClarificationPrompt clarification={clarification} onChoose={onChoose} />);
    await userEvent.click(screen.getByRole('button', { name: '#42' }));
    expect(onChoose).toHaveBeenCalledWith('42');
    await userEvent.click(screen.getByRole('button', { name: 'Latest' }));
    expect(onChoose).toHaveBeenLastCalledWith('Latest');
  });

  it('submits free text when allowOther is set', async () => {
    const onChoose = vi.fn();
    render(<ClarificationPrompt clarification={clarification} onChoose={onChoose} />);
    await userEvent.type(screen.getByRole('textbox'), 'invoice 99');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onChoose).toHaveBeenCalledWith('invoice 99');
  });
});

describe('AttachmentChips', () => {
  const attachments: ComposerAttachment[] = [
    {
      id: 'a1',
      status: 'ready',
      reference: 'blob://1',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
    },
  ];

  it('renders a chip and removes it on click', async () => {
    const onRemove = vi.fn();
    render(<AttachmentChips attachments={attachments} onRemove={onRemove} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /remove attachment report\.pdf/i }));
    expect(onRemove).toHaveBeenCalledWith('a1');
  });
});
