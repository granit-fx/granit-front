import { createMockClient } from '@granit/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AttachmentChips } from '../components/attachment-chips';
import { ChatMessage } from '../components/chat-message';
import { ClarificationPrompt } from '../components/clarification-prompt';
import { ConversationThread } from '../components/conversation-thread';
import { MessageMetrics } from '../components/message-metrics';
import { SuggestedActions } from '../components/suggested-actions';
import { ToolActivity } from '../components/tool-activity';
import { AIChatProvider } from '../providers/ai-chat-provider';

import type { ComposerAttachment } from '../components/attachment-chips';
import type { ChatTurnMetrics, ToolCallActivity } from '../hooks/use-chat-stream';
import type {
  ClarificationResponse,
  MessageResponse,
  SuggestedActionResponse,
} from '@granit/ai-chat';
import type { ReactNode } from 'react';

const turnMetrics: ChatTurnMetrics = {
  firstTokenMs: 40,
  totalMs: 293,
  tokensPerSecond: 177.5,
  chunkCount: 51,
};

/** Render under an {@link AIChatProvider} with the metrics flag toggled. */
function renderWithMetricsFlag(ui: ReactNode, showMessageMetrics: boolean) {
  const client = createMockClient();
  return render(<AIChatProvider config={{ client, showMessageMetrics }}>{ui}</AIChatProvider>);
}

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

  it('renders tool activity and suppresses the typing dots while a tool runs', () => {
    const toolCalls: ToolCallActivity[] = [
      { toolCallId: 'c1', toolName: 'query_data', status: 'running' },
    ];
    const { container } = render(
      <ConversationThread messages={messages} isStreaming toolCalls={toolCalls} />
    );
    expect(screen.getByText('Searching data…')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tool-activity"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="thread-typing"]')).not.toBeInTheDocument();
  });

  it('invokes renderMessageActions once per persisted message with its index', () => {
    const renderMessageActions = vi.fn((message: MessageResponse) => (
      <button type="button">act {message.id}</button>
    ));
    render(<ConversationThread messages={messages} renderMessageActions={renderMessageActions} />);

    expect(renderMessageActions).toHaveBeenCalledTimes(messages.length);
    expect(renderMessageActions).toHaveBeenNthCalledWith(1, messages[0], 0);
    expect(renderMessageActions).toHaveBeenNthCalledWith(2, messages[1], 1);
    expect(screen.getByRole('button', { name: 'act m1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'act m2' })).toBeInTheDocument();
  });

  it('does not invoke renderMessageActions for the streaming bubble', () => {
    const renderMessageActions = vi.fn(() => <button type="button">act</button>);
    render(
      <ConversationThread
        messages={[]}
        streamingContent="Streaming…"
        isStreaming
        renderMessageActions={renderMessageActions}
      />
    );

    expect(screen.getByText('Streaming…')).toBeInTheDocument();
    expect(renderMessageActions).not.toHaveBeenCalled();
  });
});

describe('ChatMessage', () => {
  it('renders the actions slot when actions are provided', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Hi" actions={<button type="button">Copy</button>} />
    );
    expect(container.querySelector('[data-slot="chat-message-actions"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('renders no actions container when actions are absent', () => {
    const { container } = render(<ChatMessage role="assistant" content="Hi" />);
    expect(container.querySelector('[data-slot="chat-message-actions"]')).not.toBeInTheDocument();
  });

  it('exposes a data-slot="chat-bubble" for app-level theming on both roles', () => {
    const assistant = render(<ChatMessage role="assistant" content="Hi" />);
    const assistantBubble = assistant.container.querySelector('[data-slot="chat-bubble"]');
    expect(assistantBubble).toBeInTheDocument();
    // Assistant bubble uses the lightened neutral `bg-muted` surface and the
    // left tail. Assert the surface family, not a specific opacity step, so the
    // bubble's exact tint can change without breaking the theming contract.
    // Assistant tail = square top-left (inline style, purge-proof).
    expect(assistantBubble?.className).toContain('bg-muted');
    expect(assistantBubble).toHaveStyle({ borderTopLeftRadius: '0px' });

    // User tail = square top-right.
    const user = render(<ChatMessage role="user" content="Hi" />);
    const userBubble = user.container.querySelector('[data-slot="chat-bubble"]');
    expect(userBubble?.className).toContain('bg-primary');
    expect(userBubble).toHaveStyle({ borderTopRightRadius: '0px' });
  });
});

describe('ChatMessage — Markdown rendering', () => {
  it('renders assistant Markdown to formatted elements, not literal syntax', () => {
    const { container } = render(<ChatMessage role="assistant" content={'**bold** and `code`'} />);
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('code')).toHaveTextContent('code');
    expect(container.textContent).not.toContain('**');
  });

  it('renders a Markdown list as a real <ul><li> tree', () => {
    const { container } = render(<ChatMessage role="assistant" content={'- a\n- b'} />);
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('keeps user messages as verbatim plain text (no Markdown)', () => {
    const { container } = render(<ChatMessage role="user" content="**raw**" />);
    expect(container.querySelector('strong')).not.toBeInTheDocument();
    expect(screen.getByText('**raw**')).toBeInTheDocument();
  });

  it('opens Markdown links out-of-document with a safe rel', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="[link](https://example.com)" />
    );
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
  });

  it('escapes raw HTML instead of emitting a live DOM sink', () => {
    const { container } = render(
      <ChatMessage role="assistant" content={'<img src=x onerror=alert(1)>'} />
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});

describe('ToolActivity', () => {
  it('renders a running chip with a spinner', () => {
    const toolCalls: ToolCallActivity[] = [
      { toolCallId: 'c1', toolName: 'query_data', status: 'running' },
    ];
    const { container } = render(<ToolActivity toolCalls={toolCalls} />);
    const chip = container.querySelector('[data-slot="tool-chip"]');
    expect(chip).toHaveAttribute('data-status', 'running');
    expect(screen.getByText('Searching data…')).toBeInTheDocument();
  });

  it('resolves chips to succeeded/failed and labels their status', () => {
    const toolCalls: ToolCallActivity[] = [
      { toolCallId: 'c1', toolName: 'query_data', status: 'succeeded' },
      { toolCallId: 'c2', toolName: 'search', status: 'failed' },
    ];
    const { container } = render(<ToolActivity toolCalls={toolCalls} />);
    const chips = container.querySelectorAll('[data-slot="tool-chip"]');
    expect(chips[0]).toHaveAttribute('data-status', 'succeeded');
    expect(chips[0]).toHaveAttribute('aria-label', 'Searching data… — done');
    expect(chips[1]).toHaveAttribute('data-status', 'failed');
    expect(chips[1]).toHaveAttribute('aria-label', 'Searching… — failed');
  });

  it('falls back for an unknown tool name and honours resolveToolLabel', () => {
    const toolCalls: ToolCallActivity[] = [
      { toolCallId: 'c1', toolName: 'mystery_tool', status: 'running' },
    ];
    const { rerender } = render(<ToolActivity toolCalls={toolCalls} />);
    expect(screen.getByText('Working…')).toBeInTheDocument();

    rerender(<ToolActivity toolCalls={toolCalls} resolveToolLabel={(name) => `Custom ${name}`} />);
    expect(screen.getByText('Custom mystery_tool')).toBeInTheDocument();
  });

  it('shows the thinking indicator and renders nothing when idle', () => {
    const { container, rerender } = render(<ToolActivity toolCalls={[]} isThinking />);
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tool-thinking"]')).toBeInTheDocument();

    rerender(<ToolActivity toolCalls={[]} />);
    expect(container).toBeEmptyDOMElement();
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

describe('MessageMetrics', () => {
  it('shows the total on the chip and the full breakdown in the popover', () => {
    render(<MessageMetrics metrics={turnMetrics} />);
    expect(screen.getByRole('button', { name: 'Response timing' })).toHaveTextContent('293ms');
    expect(screen.getByText('First token')).toBeInTheDocument();
    expect(screen.getByText('40ms')).toBeInTheDocument();
    expect(screen.getByText('177.5 tok/s')).toBeInTheDocument();
    expect(screen.getByText('51')).toBeInTheDocument();
  });

  it('renders a placeholder when tokens/sec is not derivable', () => {
    render(<MessageMetrics metrics={{ ...turnMetrics, tokensPerSecond: null }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats durations over a second in seconds rather than milliseconds', () => {
    render(<MessageMetrics metrics={{ ...turnMetrics, firstTokenMs: 2400, totalMs: 25909 }} />);
    // ≥10s rounds to whole seconds; <10s keeps one decimal.
    expect(screen.getByRole('button', { name: 'Response timing' })).toHaveTextContent('26s');
    expect(screen.getByText('2.4s')).toBeInTheDocument();
  });
});

describe('ConversationThread — metrics chip', () => {
  it('renders the chip on the latest assistant message when the flag is on', () => {
    renderWithMetricsFlag(<ConversationThread messages={messages} metrics={turnMetrics} />, true);
    const chips = screen.getAllByRole('button', { name: 'Response timing' });
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveTextContent('293ms');
  });

  it('hides the chip when the provider flag is off', () => {
    renderWithMetricsFlag(<ConversationThread messages={messages} metrics={turnMetrics} />, false);
    expect(screen.queryByRole('button', { name: 'Response timing' })).not.toBeInTheDocument();
  });

  it('renders no chip when there are no metrics, even with the flag on', () => {
    renderWithMetricsFlag(<ConversationThread messages={messages} />, true);
    expect(screen.queryByRole('button', { name: 'Response timing' })).not.toBeInTheDocument();
  });
});
