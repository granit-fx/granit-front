import { screen } from '@testing-library/react';

import { TranslationEditDialog } from '../components/translation-edit-dialog';

import { renderWithProviders } from './test-utils';

import type { LocalizationOverride } from '@granit/localization';

const mockOverride: LocalizationOverride = {
  id: '1',
  resourceName: 'Showcase',
  cultureName: 'fr',
  key: 'common.save',
  value: 'Sauvegarder',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'admin@granit-showcase.dev',
  modifiedAt: '2026-01-01T00:00:00Z',
  modifiedBy: 'admin@granit-showcase.dev',
};

describe('TranslationEditDialog', () => {
  it('should render the dialog when open', () => {
    renderWithProviders(
      <TranslationEditDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Edit translation')).toBeInTheDocument();
  });

  it('should display the override key as readonly', () => {
    renderWithProviders(
      <TranslationEditDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    const keyInput = screen.getByDisplayValue('common.save');
    expect(keyInput).toBeDisabled();
  });

  it('should display the module name as readonly', () => {
    renderWithProviders(
      <TranslationEditDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    const moduleInput = screen.getByDisplayValue('Showcase');
    expect(moduleInput).toBeDisabled();
  });

  it('should display the culture name as readonly', () => {
    renderWithProviders(
      <TranslationEditDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    const cultureInput = screen.getByDisplayValue('fr');
    expect(cultureInput).toBeDisabled();
  });

  it('should render save and cancel buttons', () => {
    renderWithProviders(
      <TranslationEditDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render when override is null', () => {
    renderWithProviders(
      <TranslationEditDialog override={null} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.queryByText('Edit translation')).not.toBeInTheDocument();
  });

  it('should call onOpenChange when cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <TranslationEditDialog override={mockOverride} open={true} onOpenChange={onOpenChange} />
    );
    await user.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
