import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IconPicker } from '../components/icon-picker';
import { PromptCatalogue } from '../components/prompt-catalogue';
import { PromptForm } from '../components/prompt-form';
import { PromptPicker } from '../components/prompt-picker';
import { mockPromptPicker, mockPromptSummaries } from '../testing/data';

import type { CreatePromptRequest } from '@granit/ai-prompts';

describe('PromptCatalogue', () => {
  it('offers Customise for system prompts and Edit/Delete for own (when permitted)', () => {
    render(
      <PromptCatalogue
        prompts={mockPromptSummaries}
        canManage
        canDelete
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onCustomise={vi.fn()}
      />
    );
    // System prompt → Customise, no Edit/Delete.
    expect(screen.getByRole('button', { name: /customise summarize/i })).toBeInTheDocument();
    // User prompt → Edit + Delete.
    expect(screen.getByRole('button', { name: /edit daily brief/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete daily brief/i })).toBeInTheDocument();
  });

  it('hides management affordances without permission', () => {
    render(<PromptCatalogue prompts={mockPromptSummaries} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('emits onCustomise with the system prompt id', async () => {
    const onCustomise = vi.fn();
    render(<PromptCatalogue prompts={mockPromptSummaries} canManage onCustomise={onCustomise} />);
    await userEvent.click(screen.getByRole('button', { name: /customise summarize/i }));
    expect(onCustomise).toHaveBeenCalledWith(mockPromptSummaries[0]!.id);
  });
});

describe('PromptForm', () => {
  it('blocks submit until name and instruction are filled', async () => {
    const onSubmit = vi.fn<(r: CreatePromptRequest) => void>();
    render(<PromptForm onSubmit={onSubmit} />);

    const save = screen.getByRole('button', { name: /save/i });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/name/i, { selector: 'input' }), 'Summarize');
    await userEvent.type(screen.getByLabelText(/instruction/i), 'Do the thing');
    expect(save).toBeEnabled();

    await userEvent.click(save);
    const request = onSubmit.mock.calls[0]![0];
    expect(request).toMatchObject({ name: 'Summarize', content: 'Do the thing' });
  });

  it('flags an invalid hex colour', async () => {
    render(<PromptForm onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/icon colour hex/i), 'not-a-color');
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });
});

describe('IconPicker', () => {
  it('selects an icon and edits the colour', async () => {
    const onIconChange = vi.fn();
    const onColorChange = vi.fn();
    render(
      <IconPicker
        icon="sparkles"
        iconColor="#3366FF"
        onIconChange={onIconChange}
        onColorChange={onColorChange}
      />
    );
    await userEvent.click(screen.getByRole('radio', { name: 'calendar' }));
    expect(onIconChange).toHaveBeenCalledWith('calendar');
  });
});

describe('PromptPicker', () => {
  it('renders grouped categories and selects on click', async () => {
    const onSelect = vi.fn();
    render(<PromptPicker categories={mockPromptPicker.categories} onSelect={onSelect} />);

    expect(screen.getByRole('group', { name: 'Records' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'General' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Summarize'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Summarize', isSystem: true })
    );
  });

  it('filters by the search query', async () => {
    render(<PromptPicker categories={mockPromptPicker.categories} onSelect={vi.fn()} />);
    await userEvent.type(screen.getByRole('combobox'), 'daily');
    expect(screen.getByText('Daily brief')).toBeInTheDocument();
    expect(screen.queryByText('Summarize')).toBeNull();
  });
});
