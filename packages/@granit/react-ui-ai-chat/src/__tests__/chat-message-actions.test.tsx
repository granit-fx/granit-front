import { screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatMessageActions } from '../components/chat-message-actions';

import { renderWithProviders } from './test-utils';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('ChatMessageActions', () => {
  it('copies a user message as plain text from a single button', async () => {
    // `userEvent.setup()` (inside renderWithProviders) installs a working
    // clipboard stub, so we read it back rather than asserting on a hand mock.
    const { user } = renderWithProviders(<ChatMessageActions content="Hello world" />);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Message copied'));
    expect(await navigator.clipboard.readText()).toBe('Hello world');
  });

  it('offers the three flavours for an assistant message and copies the chosen one', async () => {
    const { user } = renderWithProviders(
      <ChatMessageActions content={'# Hi\n\n**bold**'} isAssistant />
    );

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    // Verbatim Markdown source.
    await user.click(await screen.findByText('Copy with Markdown formatting'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Message copied'));
    expect(await navigator.clipboard.readText()).toBe('# Hi\n\n**bold**');

    // Stripped plain text.
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await user.click(await screen.findByText('Copy as plain text'));
    await waitFor(async () => expect(await navigator.clipboard.readText()).not.toContain('**'));
    expect(await navigator.clipboard.readText()).toContain('bold');
  });

  it('hides regenerate unless enabled, and calls onRegenerate when clicked', async () => {
    const onRegenerate = vi.fn();
    const { rerender, user } = renderWithProviders(<ChatMessageActions content="x" canReport />);
    expect(screen.queryByRole('button', { name: 'Regenerate response' })).not.toBeInTheDocument();

    rerender(
      <ChatMessageActions content="x" canRegenerate canReport onRegenerate={onRegenerate} />
    );
    await user.click(screen.getByRole('button', { name: 'Regenerate response' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('submits a report (reason + category) and closes on success', async () => {
    const onReport = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <ChatMessageActions content="x" canReport onReport={onReport} />
    );

    await user.click(screen.getByRole('button', { name: 'Report' }));

    expect(await screen.findByText('Report this message')).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Send report' });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Inaccurate' }));
    await user.type(screen.getByLabelText('Reason'), 'Wrong answer');
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(onReport).toHaveBeenCalledWith('Wrong answer', 'Inaccurate');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Message reported'));
    await waitFor(() => expect(screen.queryByText('Report this message')).not.toBeInTheDocument());
  });

  it('keeps the dialog open and shows an error when the report fails', async () => {
    const onReport = vi.fn().mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(
      <ChatMessageActions content="x" canReport onReport={onReport} />
    );

    await user.click(screen.getByRole('button', { name: 'Report' }));
    await user.type(screen.getByLabelText('Reason'), 'Wrong');
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't send the report"));
    expect(screen.getByText('Report this message')).toBeInTheDocument();
  });
});
