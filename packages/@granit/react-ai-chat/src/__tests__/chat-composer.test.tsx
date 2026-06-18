import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatComposer } from '../components/chat-composer';

import type { MentionOption, PromptOption } from '../components/composer-types';
import type { PromptId, SendMessageRequest } from '@granit/ai-chat';

const PROMPTS: PromptOption[] = [
  { id: 'p1' as PromptId, name: 'Summarize', shortDescription: 'Summarize this' },
  { id: 'p2' as PromptId, name: 'Daily brief', shortDescription: 'Your day' },
];

describe('ChatComposer', () => {
  it('inserts a prompt badge from the / picker and keeps it out of the message text', async () => {
    const onSubmit = vi.fn<(r: SendMessageRequest) => void>();
    render(<ChatComposer onSubmit={onSubmit} prompts={PROMPTS} />);

    const input = screen.getByRole('combobox');
    await userEvent.type(input, '/Sum');
    await userEvent.click(await screen.findByText('Summarize'));

    // Badge present, textarea cleared of the /token.
    expect(screen.getByText('/Summarize')).toBeInTheDocument();
    expect((input as HTMLTextAreaElement).value).toBe('');

    await userEvent.type(input, 'do it');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const request = onSubmit.mock.calls[0]![0];
    expect(request.message).toBe('do it');
    expect(request.promptRefs).toEqual(['p1']);
  });

  it('resolves @ mentions via the injected adapter and includes them in the request', async () => {
    const searchMentions = vi.fn(
      async (query: string): Promise<readonly MentionOption[]> => [
        { type: 'contact', id: 'c42', label: `Customer ${query}`, description: 'A contact' },
      ]
    );
    const onSubmit = vi.fn<(r: SendMessageRequest) => void>();
    render(<ChatComposer onSubmit={onSubmit} searchMentions={searchMentions} />);

    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'hi @ali');

    await waitFor(() => expect(searchMentions).toHaveBeenCalledWith('ali'));
    await userEvent.click(await screen.findByText('Customer ali'));

    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    const request = onSubmit.mock.calls[0]![0];
    expect(request.mentions).toEqual([{ type: 'contact', id: 'c42' }]);
    expect(request.message).toContain('@Customer ali');
  });

  it('submits on Enter and inserts a newline on Shift+Enter', async () => {
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(onSubmit).not.toHaveBeenCalled();
    expect((input as HTMLTextAreaElement).value).toBe('line one\nline two');

    await userEvent.type(input, '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('passes the selected workspace and disables send on an empty message', async () => {
    const onSubmit = vi.fn<(r: SendMessageRequest) => void>();
    render(
      <ChatComposer onSubmit={onSubmit} workspaces={['Auto', 'support']} workspace="support" />
    );

    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();

    await userEvent.type(screen.getByRole('combobox', { name: /ask your app/i }), 'hello');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(onSubmit.mock.calls[0]![0].workspaceName).toBe('support');
  });

  it('shows a Stop button while streaming', async () => {
    const onStop = vi.fn();
    render(<ChatComposer onSubmit={vi.fn()} isStreaming onStop={onStop} />);
    await userEvent.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalled();
  });

  it('renders the send action as a circular icon button with an accessible label', () => {
    render(<ChatComposer onSubmit={vi.fn()} />);
    const send = screen.getByRole('button', { name: /send/i });
    expect(send).toHaveAttribute('data-slot', 'composer-send');
    // Circular icon-only button (ArrowUp), no visible text caption.
    expect(send.className).toContain('rounded-full');
    expect(send).toHaveTextContent('');
    expect(send.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an optional workspace icon slot ahead of the selector', () => {
    render(
      <ChatComposer
        onSubmit={vi.fn()}
        workspaces={['Auto', 'support']}
        workspaceIcon={<span data-testid="ws-icon" />}
      />
    );
    expect(screen.getByTestId('ws-icon')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /workspace/i })).toBeInTheDocument();
  });

  it('uploads attachments via the adapter and includes the reference on submit', async () => {
    const uploadAttachment = vi.fn(async (file: File) => ({
      reference: 'blob://xyz',
      fileName: file.name,
      contentType: file.type || 'text/plain',
      sizeBytes: file.size,
    }));
    const onSubmit = vi.fn<(r: SendMessageRequest) => void>();
    render(<ChatComposer onSubmit={onSubmit} uploadAttachment={uploadAttachment} />);

    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    await waitFor(() => expect(screen.getByText('note.txt')).toBeInTheDocument());

    await userEvent.type(screen.getByRole('combobox'), 'see attached');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    const request = onSubmit.mock.calls[0]![0];
    expect(request.attachments).toEqual([
      { reference: 'blob://xyz', fileName: 'note.txt', contentType: 'text/plain', sizeBytes: 5 },
    ]);
  });
});
