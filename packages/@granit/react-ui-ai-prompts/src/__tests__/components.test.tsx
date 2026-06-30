import { mockPromptPicker, mockPromptSummaries } from '@granit/react-ai-prompts/testing';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IconPicker } from '../components/icon-picker';
import { PromptCatalogue } from '../components/prompt-catalogue';
import { PromptForm } from '../components/prompt-form';
import { PromptPicker } from '../components/prompt-picker';

import { renderWithProviders } from './test-utils';

import type { CreatePromptRequest } from '@granit/ai-prompts';

describe('PromptCatalogue', () => {
  it('offers Customise for system prompts and Edit/Delete for own (when permitted)', () => {
    renderWithProviders(
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
    renderWithProviders(
      <PromptCatalogue prompts={mockPromptSummaries} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('emits onCustomise with the system prompt id', async () => {
    const onCustomise = vi.fn();
    const { user } = renderWithProviders(
      <PromptCatalogue prompts={mockPromptSummaries} canManage onCustomise={onCustomise} />
    );
    await user.click(screen.getByRole('button', { name: /customise summarize/i }));
    expect(onCustomise).toHaveBeenCalledWith(mockPromptSummaries[0]!.id);
  });
});

describe('PromptForm', () => {
  it('blocks submit until name and instruction are filled', async () => {
    const onSubmit = vi.fn<(r: CreatePromptRequest) => void>();
    const { user } = renderWithProviders(<PromptForm onSubmit={onSubmit} />);

    // Empty form: submit is rejected by the spec-driven resolver (no onSubmit).
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText(/name/i, { selector: 'input' }), 'Summarize');
    await user.type(screen.getByLabelText(/instruction/i), 'Do the thing');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const request = onSubmit.mock.calls[0]![0];
    expect(request).toMatchObject({ name: 'Summarize', content: 'Do the thing' });
  });

  it('flags an invalid hex colour', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<PromptForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/icon colour hex/i), 'not-a-color');
    // The icon picker surfaces its own inline hex-format error.
    expect(screen.getByText(/#RRGGBB or #RRGGBBAA/i)).toBeInTheDocument();
  });
});

describe('IconPicker', () => {
  it('selects an icon and edits the colour', async () => {
    const onIconChange = vi.fn();
    const onColorChange = vi.fn();
    const { user } = renderWithProviders(
      <IconPicker
        icon="sparkles"
        iconColor="#3366FF"
        onIconChange={onIconChange}
        onColorChange={onColorChange}
      />
    );
    await user.click(screen.getByRole('radio', { name: 'calendar' }));
    expect(onIconChange).toHaveBeenCalledWith('calendar');
  });
});

describe('PromptPicker', () => {
  it('renders grouped categories and selects on click', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(
      <PromptPicker categories={mockPromptPicker.categories} onSelect={onSelect} />
    );

    expect(screen.getByRole('group', { name: 'Records' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'General' })).toBeInTheDocument();

    await user.click(screen.getByText('Summarize'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Summarize', isSystem: true })
    );
  });

  it('filters by the search query', async () => {
    const { user } = renderWithProviders(
      <PromptPicker categories={mockPromptPicker.categories} onSelect={vi.fn()} />
    );
    await user.type(screen.getByRole('combobox'), 'daily');
    expect(screen.getByText('Daily brief')).toBeInTheDocument();
    expect(screen.queryByText('Summarize')).toBeNull();
  });
});
