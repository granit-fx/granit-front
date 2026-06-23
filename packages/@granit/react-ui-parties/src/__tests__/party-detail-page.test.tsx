import { screen } from '@testing-library/react';

import { PartyDetailPage } from '../party-detail-page';

import { renderWithProviders } from './test-utils';

import type { PartyId, PartyResponse } from '@granit/parties';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockParty: PartyResponse = {
  id: 'party-1' as PartyId,
  tenantId: null,
  kind: 'Company',
  name: 'Acme Corp',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Brussels',
  language: 'en-GB',
  website: 'https://acme.example',
  taxId: null,
  registrationNumber: null,
  parentPartyId: null,
  userId: null,
  avatar: null,
  roles: 'Customer',
  status: 'Active',
  addresses: [],
  emails: [],
  phones: [],
  externalMappings: [],
  taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  metadata: {},
  internalNotes: null,
  createdAt: '2024-01-01T00:00:00Z',
  modifiedAt: null,
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseParams, mockNavigate } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockNavigate: vi.fn(),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams, useNavigate: () => mockNavigate };
});

const { mockUsePartyQuery } = vi.hoisted(() => ({ mockUsePartyQuery: vi.fn() }));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const noopMutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return {
    ...actual,
    usePartyQuery: mockUsePartyQuery,
    usePartiesQuery: () => ({ data: [], isLoading: false }),
    usePartiesConfig: () => ({ client: {}, basePath: '/api/v1/parties' }),
    useUpdatePartyMutation: noopMutation,
    useActivatePartyMutation: noopMutation,
    useSuspendPartyMutation: noopMutation,
    useArchivePartyMutation: noopMutation,
    PartyDuplicatesBadge: () => <div data-slot="party-duplicates-badge-stub" />,
    MergeWizard: () => <div data-slot="merge-wizard-stub" />,
  };
});

vi.mock('@granit/react-taxonomy', () => ({
  TagChipStrip: () => <div data-slot="tag-chip-strip-stub" />,
  CategorySelector: () => <div data-slot="category-selector-stub" />,
}));

vi.mock('@granit/react-authorization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PartyDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'party-1' });
  });

  afterEach(() => vi.clearAllMocks());

  it('should display the loading spinner', () => {
    mockUsePartyQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state when the party is missing', () => {
    mockUsePartyQuery.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    expect(screen.getByText('Party not found')).toBeInTheDocument();
    expect(
      screen.getByText('The party you are looking for does not exist or has been removed.')
    ).toBeInTheDocument();
  });

  it('should display the back link in the not-found state', () => {
    mockUsePartyQuery.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    expect(screen.getByText('Back to parties')).toBeInTheDocument();
  });

  it('should display the party name and kind', () => {
    mockUsePartyQuery.mockReturnValue({ data: mockParty, isLoading: false });
    renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  it('should render the detail tabs', () => {
    mockUsePartyQuery.mockReturnValue({ data: mockParty, isLoading: false });
    renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    expect(screen.getByRole('tab', { name: 'Identity' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Addresses' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tax status' })).toBeInTheDocument();
  });

  it('should render the detail page slot', () => {
    mockUsePartyQuery.mockReturnValue({ data: mockParty, isLoading: false });
    renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    expect(document.querySelector('[data-slot="party-detail-page"]')).toBeInTheDocument();
  });

  it('navigates back to the list from the not-found state', async () => {
    mockUsePartyQuery.mockReturnValue({ data: undefined, isLoading: false });
    const { user } = renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    await user.click(screen.getByRole('button', { name: 'Back to parties' }));
    expect(mockNavigate).toHaveBeenCalledWith('/parties');
  });

  it('navigates back to the list from the detail header', async () => {
    mockUsePartyQuery.mockReturnValue({ data: mockParty, isLoading: false });
    const { user } = renderWithProviders(<PartyDetailPage />, { route: '/parties/party-1' });
    await user.click(screen.getByRole('button', { name: 'Back to parties' }));
    expect(mockNavigate).toHaveBeenCalledWith('/parties');
  });
});
