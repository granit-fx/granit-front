import { fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from './__tests__/test-utils';
import { TimelineComposer } from './timeline-composer';

import type { MentionEditorProps } from './mention-editor';
import type { TimelineEntryType } from '@granit/timeline';

// Replace the TipTap-backed editor with a plain controlled <textarea>. The
// composer is a pure controlled form; mocking the child keeps every branch
// (body content, Enter-to-submit, disabled propagation) deterministic without
// dragging ProseMirror/Tippy into the assertions.
vi.mock('./mention-editor', () => ({
  MentionEditor: function MockMentionEditor({
    initialBody,
    onChange,
    onSubmit,
    disabled,
    placeholder,
    searchMentions,
  }: MentionEditorProps) {
    return (
      <textarea
        data-testid="mock-mention-editor"
        defaultValue={initialBody}
        disabled={disabled}
        placeholder={placeholder}
        data-has-search={searchMentions ? 'yes' : 'no'}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit?.();
          }
        }}
      />
    );
  },
}));

const COMMENT: TimelineEntryType = 'Comment';
const INTERNAL: TimelineEntryType = 'InternalNote';
const SYSTEM: TimelineEntryType = 'SystemLog';

function form(container: HTMLElement): HTMLFormElement {
  return container.querySelector('[data-testid="timeline-composer"]') as HTMLFormElement;
}

function submitButton(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-testid="timeline-composer-submit"]') as HTMLButtonElement;
}

function editor(container: HTMLElement): HTMLTextAreaElement {
  return container.querySelector('[data-testid="mock-mention-editor"]') as HTMLTextAreaElement;
}

function radios(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('[role="radio"]'));
}

describe('TimelineComposer', () => {
  it('renders the composer shell with submit disabled while the body is empty', () => {
    const { container } = renderWithProviders(
      <TimelineComposer onSubmit={vi.fn().mockResolvedValue(undefined)} />
    );
    expect(container.querySelector('[data-slot="timeline-composer"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline-composer-footer"]')).not.toBeNull();
    expect(submitButton(container).disabled).toBe(true);
  });

  it('enables submit once the body has content and posts the trimmed body with the default type and parentEntryId', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(
      <TimelineComposer onSubmit={onSubmit} parentEntryId="p-1" />
    );
    fireEvent.change(editor(container), { target: { value: '  Hello world  ' } });
    expect(submitButton(container).disabled).toBe(false);
    fireEvent.click(submitButton(container));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      entryType: COMMENT,
      body: 'Hello world',
      parentEntryId: 'p-1',
    });
  });

  it('clears the body after a successful submit (submit disables again)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.change(editor(container), { target: { value: 'Draft body' } });
    fireEvent.click(submitButton(container));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    await waitFor(() => expect(submitButton(container).disabled).toBe(true));
  });

  it('ignores an Enter submit when the body is only whitespace', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.change(editor(container), { target: { value: '    ' } });
    expect(submitButton(container).disabled).toBe(true);
    fireEvent.keyDown(editor(container), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits via the Enter key forwarded from the editor', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.change(editor(container), { target: { value: 'Hi' } });
    fireEvent.keyDown(editor(container), { key: 'Enter' });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ body: 'Hi' }));
  });

  it('shows the sending state and disables the editor while the submit promise is pending', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.change(editor(container), { target: { value: 'Pending' } });
    fireEvent.click(submitButton(container));

    await waitFor(() => expect(submitButton(container).disabled).toBe(true));
    expect(submitButton(container).textContent).toContain('Sending');
    expect(editor(container).disabled).toBe(true);

    resolveSubmit?.();
    await waitFor(() => expect(editor(container).disabled).toBe(false));
  });

  it('renders a radio per allowed type and toggles the active type (internal-note styling)', () => {
    const { container } = renderWithProviders(
      <TimelineComposer onSubmit={vi.fn().mockResolvedValue(undefined)} />
    );
    const selector = container.querySelector('[data-testid="timeline-composer-type-selector"]');
    expect(selector).not.toBeNull();
    const options = radios(container);
    expect(options).toHaveLength(2);
    expect(options[0]?.getAttribute('aria-checked')).toBe('true');
    expect(options[1]?.getAttribute('aria-checked')).toBe('false');
    expect(form(container).className).not.toContain('border-primary/30');

    fireEvent.click(options[1] as HTMLButtonElement);
    expect(radios(container)[1]?.getAttribute('aria-checked')).toBe('true');
    expect(form(container).className).toContain('border-primary/30');
  });

  it('posts the entry type selected in the radiogroup', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.click(radios(container)[1] as HTMLButtonElement);
    fireEvent.change(editor(container), { target: { value: 'Note' } });
    fireEvent.click(submitButton(container));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ entryType: INTERNAL }));
  });

  it('hides the selector when hideEntryTypeSelector is set even with multiple types', () => {
    const { container } = renderWithProviders(
      <TimelineComposer onSubmit={vi.fn().mockResolvedValue(undefined)} hideEntryTypeSelector />
    );
    expect(container.querySelector('[data-testid="timeline-composer-type-selector"]')).toBeNull();
  });

  it('hides the selector when only one entry type is allowed', () => {
    const { container } = renderWithProviders(
      <TimelineComposer onSubmit={vi.fn().mockResolvedValue(undefined)} entryTypes={[COMMENT]} />
    );
    expect(container.querySelector('[data-testid="timeline-composer-type-selector"]')).toBeNull();
  });

  it('pre-selects a valid initialEntryType and applies the internal-note styling on mount', () => {
    const { container } = renderWithProviders(
      <TimelineComposer
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        entryTypes={[COMMENT, INTERNAL]}
        initialEntryType={INTERNAL}
      />
    );
    const options = radios(container);
    expect(options[0]?.getAttribute('aria-checked')).toBe('false');
    expect(options[1]?.getAttribute('aria-checked')).toBe('true');
    expect(form(container).className).toContain('border-primary/30');
  });

  it('falls back to the first type when initialEntryType is not in the allowed list and renders the SystemLog label', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(
      <TimelineComposer
        onSubmit={onSubmit}
        entryTypes={[COMMENT, SYSTEM]}
        initialEntryType={INTERNAL}
      />
    );
    const options = radios(container);
    expect(options).toHaveLength(2);
    expect(options[0]?.getAttribute('aria-checked')).toBe('true');
    // SystemLog branch of pickEntryTypeLabel — key resolves to its raw form.
    expect(options[1]?.textContent).toContain('SystemLog');

    fireEvent.change(editor(container), { target: { value: 'x' } });
    fireEvent.click(submitButton(container));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ entryType: COMMENT }));
  });

  it('forwards className, placeholder, submitLabel and searchMentions', () => {
    const { container } = renderWithProviders(
      <TimelineComposer
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        className="my-composer"
        placeholder="Type here…"
        submitLabel="Post"
        searchMentions={vi.fn().mockResolvedValue([])}
      />
    );
    expect(form(container).className).toContain('my-composer');
    expect(submitButton(container).textContent).toBe('Post');
    expect(editor(container).getAttribute('placeholder')).toBe('Type here…');
    expect(editor(container).getAttribute('data-has-search')).toBe('yes');
  });

  it('swallows a rejected submit from the button path and keeps the body for retry', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.change(editor(container), { target: { value: 'Keep me' } });
    fireEvent.click(submitButton(container));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    // Rejection is swallowed; body is untouched so submit re-enables for a retry.
    await waitFor(() => expect(submitButton(container).disabled).toBe(false));
  });

  it('swallows a rejected submit from the Enter path', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    const { container } = renderWithProviders(<TimelineComposer onSubmit={onSubmit} />);
    fireEvent.change(editor(container), { target: { value: 'Retry via enter' } });
    fireEvent.keyDown(editor(container), { key: 'Enter' });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    await waitFor(() => expect(submitButton(container).disabled).toBe(false));
  });

  it('seeds the body from initialBody so submit is enabled on mount', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(
      <TimelineComposer onSubmit={onSubmit} initialBody="Existing draft" />
    );
    expect(submitButton(container).disabled).toBe(false);
    fireEvent.click(submitButton(container));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ body: 'Existing draft' }));
  });
});
