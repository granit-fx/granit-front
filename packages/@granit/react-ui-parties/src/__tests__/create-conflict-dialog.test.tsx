import { screen, waitFor } from '@testing-library/react';

import { CreateConflictDialog } from '../components/create-conflict-dialog';

import { renderWithProviders } from './test-utils';

import type { PartyCreateConflictResponse, PartyId, PartyResponse } from '@granit/parties';
import type * as RouterDom from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof RouterDom>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../components/merge-wizard', () => ({
  MergeWizard: ({
    survivorId,
    loserId,
    onSuccess,
  }: {
    survivorId: PartyId;
    loserId: PartyId;
    onSuccess?: (r: { survivorId: PartyId; loserId: PartyId }) => void;
  }) => (
    <div data-slot="merge-wizard-stub">
      <p>
        wizard for {survivorId} ← {loserId}
      </p>
      <button type="button" onClick={() => onSuccess?.({ survivorId, loserId })}>
        wizard-success
      </button>
    </div>
  ),
}));

vi.mock('@granit/react-parties', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePartyQuery: (id: PartyId | null | undefined) => ({
    data:
      id != null
        ? ({
            id,
            tenantId: null,
            kind: 'Company',
            name: 'Acme Corp',
            roles: 'Customer',
            status: 'Active',
            defaultCurrency: 'EUR',
            timezone: 'UTC',
            language: null,
            website: null,
            taxId: null,
            registrationNumber: null,
            parentPartyId: null,
            userId: null,
            avatar: null,
            addresses: [],
            emails: [
              {
                id: 'e1' as PartyId,
                address: 'billing@acme.example',
                isPrimary: true,
                label: null,
              },
            ],
            phones: [],
            externalMappings: [],
            taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
            metadata: {},
            internalNotes: null,
          } satisfies PartyResponse)
        : undefined,
    isLoading: false,
  }),
}));

const conflict: PartyCreateConflictResponse = {
  reason: 'Acme Corp already exists.',
  candidates: [
    {
      candidateId: 'existing-1' as PartyId,
      score: 1.0,
      tier: 'Deterministic',
      signals: [{ kind: 'NameExact', score: 1.0 }],
    },
  ],
};

describe('CreateConflictDialog', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('lists each conflicting candidate', () => {
    renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText('Potential duplicate detected')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument();
  });

  it('navigates to the existing party on Use existing', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={vi.fn()} onClose={onClose} />
    );

    await user.click(screen.getByRole('button', { name: /Use this one/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/parties/existing-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onCreateAnyway and navigates to the new party on Create anyway', async () => {
    const onCreateAnyway = vi.fn().mockResolvedValue('new-id' as PartyId);
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={onCreateAnyway} onClose={onClose} />
    );

    await user.click(screen.getByRole('button', { name: /Create anyway/i }));

    await waitFor(() => {
      expect(onCreateAnyway).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/parties/new-id');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('opens the merge wizard on Merge into existing once the force-create resolves', async () => {
    const onCreateAnyway = vi.fn().mockResolvedValue('new-id' as PartyId);
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={onCreateAnyway} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /Merge into this one/i }));

    expect(await screen.findByText(/wizard for existing-1 ← new-id/)).toBeInTheDocument();
  });

  it('navigates to the survivor after a successful merge', async () => {
    const onCreateAnyway = vi.fn().mockResolvedValue('new-id' as PartyId);
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={onCreateAnyway} onClose={onClose} />
    );

    await user.click(screen.getByRole('button', { name: /Merge into this one/i }));
    await user.click(await screen.findByRole('button', { name: 'wizard-success' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/parties/existing-1');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('stays on the choose phase when force-create returns null', async () => {
    const onCreateAnyway = vi.fn().mockResolvedValue(null);
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={onCreateAnyway} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /Create anyway/i }));

    await waitFor(() => {
      expect(onCreateAnyway).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText('Potential duplicate detected')).toBeInTheDocument();
  });

  it('recovers when force-create rejects', async () => {
    const onCreateAnyway = vi.fn().mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={onCreateAnyway} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /Create anyway/i }));

    await waitFor(() => {
      expect(onCreateAnyway).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not open the merge wizard when force-create returns null', async () => {
    const onCreateAnyway = vi.fn().mockResolvedValue(null);
    const { user } = renderWithProviders(
      <CreateConflictDialog conflict={conflict} onCreateAnyway={onCreateAnyway} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /Merge into this one/i }));

    await waitFor(() => {
      expect(onCreateAnyway).toHaveBeenCalled();
    });
    expect(screen.queryByText(/wizard for/)).not.toBeInTheDocument();
  });

  it('renders nothing actionable when there is no conflict', () => {
    renderWithProviders(
      <CreateConflictDialog conflict={null} onCreateAnyway={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.queryByText('Potential duplicate detected')).not.toBeInTheDocument();
  });
});
