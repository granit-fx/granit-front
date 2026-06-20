import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatComposer } from '../components/chat-composer';
import { createChipElement } from '../components/composer-content';

import type { ChipSpec } from '../components/composer-content';
import type { MentionOption, PromptOption } from '../components/composer-types';
import type { PromptId, SendMessageRequest } from '@granit/ai-chat';

const PROMPTS: PromptOption[] = [
  { id: 'p1' as PromptId, name: 'Summarize', shortDescription: 'Summarize this' },
  { id: 'p2' as PromptId, name: 'Daily brief', shortDescription: 'Your day' },
];

/** The contenteditable message input. */
const getEditor = () => screen.getByRole('textbox', { name: /ask your app/i });

/**
 * Build the editor content from interleaved text + chip specs (as the editor
 * holds it after picks) and fire the input event the component listens on.
 */
const setEditorContent = (...segments: ReadonlyArray<string | ChipSpec>) => {
  const editor = getEditor();
  editor.replaceChildren();
  for (const segment of segments) {
    editor.appendChild(
      typeof segment === 'string'
        ? document.createTextNode(segment)
        : createChipElement(document, segment)
    );
  }
  fireEvent.input(editor);
  return editor;
};

describe('ChatComposer', () => {
  it('serializes chips into the message and the structured prompt/mention refs', async () => {
    const onSubmit = vi.fn<(r: SendMessageRequest) => void>();
    render(<ChatComposer onSubmit={onSubmit} prompts={PROMPTS} />);

    setEditorContent(
      'Fait moi un ',
      { kind: 'prompt', id: 'p1', label: 'Daily brief' },
      ' sur ',
      { kind: 'mention', id: 'ua1', type: 'account', label: 'United Airlines' },
      ' de manière précise.'
    );
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const request = onSubmit.mock.calls[0]![0];
    // Each chip leaves a bold marker inline so the sent message re-renders it.
    expect(request.message).toBe(
      'Fait moi un **/Daily brief** sur **@United Airlines** de manière précise.'
    );
    expect(request.promptRefs).toEqual(['p1']);
    expect(request.mentions).toEqual([{ type: 'account', id: 'ua1' }]);
  });

  it('opens the / prompt picker as the query is typed', async () => {
    render(<ChatComposer onSubmit={vi.fn()} prompts={PROMPTS} />);

    await userEvent.type(getEditor(), '/Sum');

    // The picker is open and filtered to the matching prompt.
    expect(await screen.findByText('Summarize')).toBeInTheDocument();
    expect(screen.queryByText('Daily brief')).not.toBeInTheDocument();
  });

  it('renders the resolved @ mention suggestions in the picker', async () => {
    const searchMentions = vi.fn<(query: string) => Promise<MentionOption[]>>(async () => [
      { type: 'contact', id: 'c-42', label: 'Acme Corp', description: 'Customer' },
    ]);
    render(<ChatComposer onSubmit={vi.fn()} searchMentions={searchMentions} />);

    await userEvent.type(getEditor(), '@ac');

    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(searchMentions).toHaveBeenLastCalledWith('ac');
  });

  it('coalesces fast @ typing into a single debounced search for the final query', async () => {
    const searchMentions = vi.fn<(query: string) => Promise<MentionOption[]>>(async () => []);
    render(<ChatComposer onSubmit={vi.fn()} searchMentions={searchMentions} />);

    // Five keystrokes land well within the 200 ms window, so the debounce fires
    // exactly once — for the final query, not each intermediate prefix.
    await userEvent.type(getEditor(), '@acme');

    await waitFor(() => expect(searchMentions).toHaveBeenCalledTimes(1));
    expect(searchMentions).toHaveBeenLastCalledWith('acme');
  });

  it('submits on Enter and stays put on Shift+Enter', async () => {
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);
    const editor = setEditorContent('hello');

    fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].message).toBe('hello');
  });

  it('passes the selected workspace and disables send on an empty message', async () => {
    const onSubmit = vi.fn<(r: SendMessageRequest) => void>();
    render(
      <ChatComposer onSubmit={onSubmit} workspaces={['Auto', 'support']} workspace="support" />
    );

    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();

    setEditorContent('hello');
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(onSubmit.mock.calls[0]![0].workspaceName).toBe('support');
  });

  it('shows the placeholder only while the editor is empty', () => {
    render(<ChatComposer onSubmit={vi.fn()} />);
    expect(screen.getByText(/ask your app/i)).toHaveAttribute('data-slot', 'composer-placeholder');

    setEditorContent('typed');
    expect(screen.queryByText((_, el) => el?.dataset?.slot === 'composer-placeholder')).toBeNull();
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

  it('renders the workspace picker as a chip trigger with the fallback icon', () => {
    render(
      <ChatComposer
        onSubmit={vi.fn()}
        workspaces={['Auto', 'support']}
        workspaceIcon={<span data-testid="ws-icon" />}
      />
    );
    const trigger = screen.getByRole('button', { name: /workspace/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByTestId('ws-icon')).toBeInTheDocument();
  });

  it('opens the model picker, shows capabilities/groups, and selects an option', async () => {
    const onWorkspaceChange = vi.fn();
    render(
      <ChatComposer
        onSubmit={vi.fn()}
        workspace="auto"
        onWorkspaceChange={onWorkspaceChange}
        workspaceOptions={[
          {
            value: 'auto',
            label: 'DeepSeek V3.2',
            icon: <span data-testid="opt-icon" />,
            group: 'Available',
            capabilities: [<span key="t" data-testid="cap-tools" />],
          },
          { value: 'kimi', label: 'Kimi K2.5', group: 'Available' },
          { value: 'qwen', label: 'Qwen3-14B', group: 'Alibaba', disabled: true },
        ]}
      />
    );

    // Trigger reflects the selected option's own icon + label.
    const trigger = screen.getByRole('button', { name: /workspace/i });
    expect(trigger).toHaveTextContent('DeepSeek V3.2');

    await userEvent.click(trigger);

    // Listbox with provider group headings and capability glyphs.
    expect(screen.getByRole('listbox', { name: /workspace/i })).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Alibaba')).toBeInTheDocument();
    expect(screen.getByTestId('cap-tools')).toBeInTheDocument();

    // Disabled option is announced as such and does not select.
    const locked = screen.getByText('Qwen3-14B').closest('[role="option"]');
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(locked!);
    expect(onWorkspaceChange).not.toHaveBeenCalled();

    // A selectable option commits its value.
    await userEvent.click(screen.getByText('Kimi K2.5'));
    expect(onWorkspaceChange).toHaveBeenCalledWith('kimi');
  });

  it('filters the model picker via its search field for long lists', async () => {
    render(
      <ChatComposer
        onSubmit={vi.fn()}
        workspace="m1"
        onWorkspaceChange={vi.fn()}
        workspaceOptions={Array.from({ length: 7 }, (_, i) => ({
          value: `m${i + 1}`,
          label: `Model ${i + 1}`,
        }))}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /workspace/i }));
    const search = screen.getByRole('textbox', { name: /search models/i });
    await userEvent.type(search, 'Model 5');

    // Scope to the listbox — the trigger keeps showing the selected label.
    const listbox = screen.getByRole('listbox', { name: /workspace/i });
    expect(within(listbox).getByText('Model 5')).toBeInTheDocument();
    expect(within(listbox).queryByText('Model 1')).not.toBeInTheDocument();
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

    await screen.findByText('note.txt');

    setEditorContent('see attached');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    const request = onSubmit.mock.calls[0]![0];
    expect(request.attachments).toEqual([
      { reference: 'blob://xyz', fileName: 'note.txt', contentType: 'text/plain', sizeBytes: 5 },
    ]);
  });
});
