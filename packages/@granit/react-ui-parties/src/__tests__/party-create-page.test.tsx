import { screen, waitFor } from '@testing-library/react';

import { PartyCreatePage } from '../party-create-page';

import { renderWithProviders } from './test-utils';

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
  };
});

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
});
