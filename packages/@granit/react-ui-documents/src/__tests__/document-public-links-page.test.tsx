import { screen } from '@testing-library/react';

import { DocumentPublicLinksPage } from '../document-public-links-page';

import { renderWithProviders } from './test-utils';

import type { PublicLinkResponse } from '@granit/documents';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

const { mockUseDocumentPublicLinks, mockCreate, mockRevoke } = vi.hoisted(() => ({
  mockUseDocumentPublicLinks: vi.fn(),
  mockCreate: vi.fn(),
  mockRevoke: vi.fn(),
}));

vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDocumentPublicLinks: mockUseDocumentPublicLinks,
    useCreateDocumentPublicLink: () => ({ mutate: mockCreate, isPending: false }),
    useRevokeDocumentPublicLink: () => ({ mutate: mockRevoke, isPending: false }),
  };
});

// Grant all permissions so the manage-only create/revoke controls render.
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (v: string) => v,
      formatDateTime: (v: string) => `formatted:${v}`,
      formatTimeAgo: (v: string) => v,
    }),
  };
});

const mockLink: PublicLinkResponse = {
  id: 'link-1',
  documentId: 'doc-1',
  scope: 'Download',
  expiresAt: '2026-02-01T00:00:00Z',
  maxUses: 10,
  currentUses: 3,
  revokedAt: null,
  revocationReason: null,
  createdAt: '2026-01-01T00:00:00Z',
  concurrencyStamp: 'stamp-1',
};

describe('DocumentPublicLinksPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the not-found state when the id param is missing', () => {
    mockUseParams.mockReturnValue({});
    mockUseDocumentPublicLinks.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<DocumentPublicLinksPage />);
    expect(document.querySelector('[data-slot="document-public-links-page"]')).toBeInTheDocument();
    expect(screen.getByText('Document not found.')).toBeInTheDocument();
  });

  it('renders the empty state when there are no links', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<DocumentPublicLinksPage />, { route: '/documents/doc-1/public-links' });
    expect(screen.getByText('No public links yet.')).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<DocumentPublicLinksPage />, { route: '/documents/doc-1/public-links' });
    expect(screen.getByText('Loading links…')).toBeInTheDocument();
  });

  it('renders a links table with formatted expiry and usage counts', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [mockLink], isLoading: false });
    renderWithProviders(<DocumentPublicLinksPage />, { route: '/documents/doc-1/public-links' });
    const row = screen.getByText('formatted:2026-02-01T00:00:00Z').closest('tr');
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent('Download');
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('calls the create mutation when the create button is clicked', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<DocumentPublicLinksPage />, {
      route: '/documents/doc-1/public-links',
    });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc-1',
        request: expect.objectContaining({ scope: 'Download' }),
      })
    );
  });

  it('creates a link with the edited scope, ttl and max-uses form values', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<DocumentPublicLinksPage />, {
      route: '/documents/doc-1/public-links',
    });
    await user.selectOptions(screen.getByLabelText('Scope'), 'View');
    const ttl = screen.getByLabelText('Validity (days)');
    await user.clear(ttl);
    await user.type(ttl, '30');
    await user.type(screen.getByLabelText(/Max uses/), '5');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreate).toHaveBeenCalledWith({
      documentId: 'doc-1',
      request: { scope: 'View', ttlDays: 30, maxUses: 5 },
    });
  });

  it('sends a null max-uses when the field is left blank', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<DocumentPublicLinksPage />, {
      route: '/documents/doc-1/public-links',
    });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ request: expect.objectContaining({ maxUses: null }) })
    );
  });

  it('revokes a link with the typed reason when revoke is clicked', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [mockLink], isLoading: false });
    const { user } = renderWithProviders(<DocumentPublicLinksPage />, {
      route: '/documents/doc-1/public-links',
    });
    await user.type(screen.getByPlaceholderText('Reason'), 'expired campaign');
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(mockRevoke).toHaveBeenCalledWith({
      id: mockLink.id,
      documentId: mockLink.documentId,
      request: { reason: 'expired campaign' },
    });
  });

  it('revokes with a null reason when none is typed', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentPublicLinks.mockReturnValue({ data: [mockLink], isLoading: false });
    const { user } = renderWithProviders(<DocumentPublicLinksPage />, {
      route: '/documents/doc-1/public-links',
    });
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(mockRevoke).toHaveBeenCalledWith(expect.objectContaining({ request: { reason: null } }));
  });
});
