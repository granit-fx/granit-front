import { mockLocalizationOverrides } from '@granit/react-localization/testing';
import { screen } from '@testing-library/react';

import { TranslationDeleteDialog } from '../components/translation-delete-dialog';

import { renderWithProviders } from './test-utils';

const mockOverride = mockLocalizationOverrides[0];

describe('TranslationDeleteDialog', () => {
  it('should render the dialog when open', () => {
    renderWithProviders(
      <TranslationDeleteDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Delete override')).toBeInTheDocument();
  });

  it('should display the override key in the confirmation message', () => {
    renderWithProviders(
      <TranslationDeleteDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText(/common\.save/)).toBeInTheDocument();
  });

  it('should display the culture name in the confirmation message', () => {
    renderWithProviders(
      <TranslationDeleteDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText(/\(fr\)/)).toBeInTheDocument();
  });

  it('should render confirm and cancel buttons', () => {
    renderWithProviders(
      <TranslationDeleteDialog override={mockOverride} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render when override is null', () => {
    renderWithProviders(
      <TranslationDeleteDialog override={null} open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.queryByText('Delete override')).not.toBeInTheDocument();
  });
});
