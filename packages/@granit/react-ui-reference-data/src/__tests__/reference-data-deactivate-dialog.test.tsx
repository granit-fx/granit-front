import { screen } from '@testing-library/react';

import { ReferenceDataDeactivateDialog } from '../components/reference-data-deactivate-dialog';

import { renderWithProviders } from './test-utils';

import type { ReferenceDataResponse } from '../components/types';

function makeEntry(overrides: Partial<ReferenceDataResponse> = {}): ReferenceDataResponse {
  return {
    id: 'rd-1' as ReferenceDataResponse['id'],
    code: 'BE',
    label: 'Belgium',
    labelEn: 'Belgium',
    labelFr: 'Belgique',
    labelNl: '',
    labelDe: '',
    labelEs: '',
    labelIt: '',
    labelPt: '',
    labelZh: '',
    labelJa: '',
    labelPl: '',
    labelTr: '',
    labelKo: '',
    labelSv: '',
    labelCs: '',
    labelHi: '',
    activated: true,
    sortOrder: 0,
    validFrom: null,
    validTo: null,
    parentCode: null,
    metadata: null,
    ...overrides,
  };
}

describe('ReferenceDataDeactivateDialog', () => {
  it('renders nothing when entry is null', () => {
    const { container } = renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={null}
        action="deactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render content when closed', () => {
    renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={makeEntry()}
        action="deactivate"
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText('Deactivate Entry')).not.toBeInTheDocument();
  });

  it('renders the deactivate title and interpolated message', () => {
    renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={makeEntry({ labelEn: 'Belgium', code: 'BE' })}
        action="deactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Deactivate Entry')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to deactivate Belgium (BE)?')
    ).toBeInTheDocument();
  });

  it('renders the reactivate title and message', () => {
    renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={makeEntry()}
        action="reactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Reactivate Entry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={makeEntry()}
        action="deactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={makeEntry()}
        action="deactivate"
        open
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables the buttons and shows a pending indicator while pending', () => {
    renderWithProviders(
      <ReferenceDataDeactivateDialog
        entry={makeEntry()}
        action="deactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />
    );
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
