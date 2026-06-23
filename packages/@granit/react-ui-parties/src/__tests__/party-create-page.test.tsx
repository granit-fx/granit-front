import { screen, waitFor } from '@testing-library/react';

import { PartyCreatePage } from '../party-create-page';

import { renderWithProviders } from './test-utils';

import type { AxiosError } from '@granit/api-client';
import type { PartyId } from '@granit/parties';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const { mockMutateAsync } = vi.hoisted(() => ({ mockMutateAsync: vi.fn() }));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useCreatePartyMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
    usePartyQuery: () => ({ data: undefined, isLoading: false }),
  };
});

function conflictError(): AxiosError {
  const err = new Error('conflict') as AxiosError;
  err.isAxiosError = true;
  err.response = {
    status: 409,
    data: {
      reason: 'Deterministic',
      candidates: [
        { candidateId: 'dup-1' as PartyId, score: 0.95, tier: 'Deterministic', signals: [] },
      ],
    },
    statusText: 'Conflict',
    headers: {},
    config: {} as never,
  };
  return err;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PartyCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutateAsync.mockClear();
  });

  it('should render the page title', async () => {
    renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });
    await waitFor(() => {
      expect(screen.getByText('Create a party')).toBeInTheDocument();
    });
  });

  it('should render the back-to-list link', async () => {
    renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });
    await waitFor(() => {
      expect(screen.getByText('Back to parties')).toBeInTheDocument();
    });
  });

  it('should render the create form', async () => {
    renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });
    await waitFor(() => {
      expect(document.querySelector('[data-slot="party-create-form"]')).toBeInTheDocument();
    });
  });

  it('should render the form fields and submit button', async () => {
    renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Default currency')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create party' })).toBeInTheDocument();
  });

  it('creates a party and navigates to its detail page on success', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'new-party' });
    const { user } = renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });

    await user.type(await screen.findByLabelText('Name'), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: 'Create party' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        request: expect.objectContaining({ name: 'Acme Corp', kind: 'Company' }),
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/parties/new-party');
  });

  it('navigates to the list on cancel', async () => {
    const { user } = renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/parties');
  });

  it('opens the conflict dialog on a 409 response', async () => {
    mockMutateAsync.mockRejectedValueOnce(conflictError());
    const { user } = renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });

    await user.type(await screen.findByLabelText('Name'), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: 'Create party' }));

    expect(await screen.findByText('Potential duplicate detected')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('force-creates the party from the conflict dialog', async () => {
    mockMutateAsync.mockRejectedValueOnce(conflictError());
    mockMutateAsync.mockResolvedValueOnce({ id: 'forced-party' });
    const { user } = renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });

    await user.type(await screen.findByLabelText('Name'), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: 'Create party' }));

    await user.click(await screen.findByRole('button', { name: 'Create anyway' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenLastCalledWith({
        request: expect.objectContaining({ name: 'Acme Corp' }),
        options: { force: true },
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/parties/forced-party');
  });

  it('logs and stays on the page for a non-conflict error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<PartyCreatePage />, { route: '/parties/new' });

    await user.type(await screen.findByLabelText('Name'), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: 'Create party' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText('Potential duplicate detected')).not.toBeInTheDocument();
  });
});
