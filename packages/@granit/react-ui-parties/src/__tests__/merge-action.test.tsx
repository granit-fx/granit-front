import { screen, waitFor } from '@testing-library/react';

import { MergeAction } from '../components/merge-action';

import { renderWithProviders } from './test-utils';

import type { PartyId, PartyListItemResponse } from '@granit/parties';
import type * as RouterDom from 'react-router';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof RouterDom>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUsePartiesQuery = vi.fn();
vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePartiesQuery: () => mockUsePartiesQuery(),
  };
});

vi.mock('../components/merge-wizard', () => ({
  MergeWizard: ({
    survivorId,
    loserId,
    onCancel,
    onSuccess,
  }: {
    survivorId: PartyId;
    loserId: PartyId;
    onCancel?: () => void;
    onSuccess?: (r: { survivorId: PartyId; loserId: PartyId }) => void;
  }) => (
    <div data-slot="merge-wizard-stub">
      <p>
        wizard for {survivorId} ← {loserId}
      </p>
      <button type="button" onClick={onCancel}>
        wizard-cancel
      </button>
      <button type="button" onClick={() => onSuccess?.({ survivorId, loserId })}>
        wizard-success
      </button>
    </div>
  ),
}));

const survivorId = 's1' as PartyId;
const loserCandidate: PartyListItemResponse = {
  id: 'l1' as PartyId,
  tenantId: null,
  kind: 'Company',
  name: 'Globex Inc',
  roles: 'Customer',
  status: 'Active',
  defaultCurrency: 'EUR',
  primaryEmail: 'ap@globex.example',
  primaryPhone: null,
};

describe('MergeAction', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUsePartiesQuery.mockReset();
  });

  it('shows the trigger button', () => {
    mockUsePartiesQuery.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<MergeAction survivorId={survivorId} survivorName="Acme" />);
    expect(screen.getByRole('button', { name: /Merge with/i })).toBeInTheDocument();
  });

  it('opens the picker dialog and lists candidates excluding the survivor', async () => {
    mockUsePartiesQuery.mockReturnValue({
      data: [
        loserCandidate,
        { ...loserCandidate, id: survivorId, name: 'Acme self' },
        { ...loserCandidate, id: 'l2' as PartyId, name: 'Archived Co', status: 'Archived' },
      ],
      isLoading: false,
    });
    const { user } = renderWithProviders(
      <MergeAction survivorId={survivorId} survivorName="Acme" />
    );

    await user.click(screen.getByRole('button', { name: /Merge with/i }));

    expect(await screen.findByText('Pick a party to merge into this one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Globex Inc/ })).toBeInTheDocument();
    expect(screen.queryByText('Acme self')).not.toBeInTheDocument();
    expect(screen.queryByText('Archived Co')).not.toBeInTheDocument();
  });

  it('selecting a candidate opens the merge wizard', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: [loserCandidate], isLoading: false });
    const { user } = renderWithProviders(
      <MergeAction survivorId={survivorId} survivorName="Acme" />
    );

    await user.click(screen.getByRole('button', { name: /Merge with/i }));
    await user.click(screen.getByRole('button', { name: /Globex Inc/ }));

    expect(await screen.findByText(/wizard for s1 ← l1/)).toBeInTheDocument();
  });

  it('navigates to the survivor detail on wizard success', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: [loserCandidate], isLoading: false });
    const { user } = renderWithProviders(
      <MergeAction survivorId={survivorId} survivorName="Acme" />
    );

    await user.click(screen.getByRole('button', { name: /Merge with/i }));
    await user.click(screen.getByRole('button', { name: /Globex Inc/ }));
    await user.click(await screen.findByRole('button', { name: 'wizard-success' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/parties/s1');
    });
  });

  it('returns to idle when the wizard is cancelled', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: [loserCandidate], isLoading: false });
    const { user } = renderWithProviders(
      <MergeAction survivorId={survivorId} survivorName="Acme" />
    );

    await user.click(screen.getByRole('button', { name: /Merge with/i }));
    await user.click(screen.getByRole('button', { name: /Globex Inc/ }));
    await user.click(await screen.findByRole('button', { name: 'wizard-cancel' }));

    await waitFor(() => {
      expect(screen.queryByText(/wizard for/)).not.toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('closes the picker without selecting via cancel', async () => {
    mockUsePartiesQuery.mockReturnValue({ data: [loserCandidate], isLoading: false });
    const { user } = renderWithProviders(
      <MergeAction survivorId={survivorId} survivorName="Acme" />
    );

    await user.click(screen.getByRole('button', { name: /Merge with/i }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Pick a party to merge into this one')).not.toBeInTheDocument();
    });
  });
});
