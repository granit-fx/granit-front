import { sampleParties, toListItem } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { PartyPickerDialog } from '../components/party-picker-dialog';

import { renderWithProviders } from './test-utils';

import type { PartyId, PartyListItemResponse } from '@granit/parties';

const { mockUsePartiesQuery } = vi.hoisted(() => ({ mockUsePartiesQuery: vi.fn() }));

vi.mock('@granit/react-parties', () => ({
  usePartiesQuery: () => mockUsePartiesQuery(),
}));

const items: PartyListItemResponse[] = sampleParties.map(toListItem);
const excludeId = sampleParties[0]!.id as PartyId;

describe('PartyPickerDialog', () => {
  beforeEach(() => {
    mockUsePartiesQuery.mockReset();
  });

  it('shows the spinner while loading', () => {
    mockUsePartiesQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(
      <PartyPickerDialog open excludeId={excludeId} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    );
    expect(screen.getByText('Pick a party to merge into this one')).toBeInTheDocument();
  });

  it('lists candidates excluding the survivor and archived parties', () => {
    mockUsePartiesQuery.mockReturnValue({ data: items, isLoading: false });
    renderWithProviders(
      <PartyPickerDialog open excludeId={excludeId} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    );
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    expect(screen.queryByText('Bob Dupont')).not.toBeInTheDocument();
  });

  it('filters candidates by the search term', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: items, isLoading: false });
    const { user } = renderWithProviders(
      <PartyPickerDialog open excludeId={excludeId} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    );
    await user.type(screen.getByLabelText('Search by name…'), 'globex');
    await waitFor(() => {
      expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    });
    expect(screen.queryByText('Initech BV')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: items, isLoading: false });
    const { user } = renderWithProviders(
      <PartyPickerDialog open excludeId={excludeId} onOpenChange={vi.fn()} onSelect={vi.fn()} />
    );
    await user.type(screen.getByLabelText('Search by name…'), 'zzz-no-match');
    expect(await screen.findByText('No active parties available to merge.')).toBeInTheDocument();
  });

  it('calls onSelect when a candidate is clicked', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: items, isLoading: false });
    const onSelect = vi.fn();
    const { user } = renderWithProviders(
      <PartyPickerDialog open excludeId={excludeId} onOpenChange={vi.fn()} onSelect={onSelect} />
    );
    await user.click(screen.getByRole('button', { name: /Globex Inc/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Globex Inc' }));
  });

  it('closes via the cancel button', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: items, isLoading: false });
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <PartyPickerDialog
        open
        excludeId={excludeId}
        onOpenChange={onOpenChange}
        onSelect={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
