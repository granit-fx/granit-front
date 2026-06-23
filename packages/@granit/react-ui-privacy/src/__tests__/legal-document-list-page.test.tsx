import { screen, waitFor } from '@testing-library/react';

import { LegalDocumentListPage } from '../legal-documents/legal-document-list-page';

import { renderWithProviders } from './test-utils';

import type { LegalDocumentDetailResponse } from '@granit/privacy';

const { mockUseLegalDocuments } = vi.hoisted(() => ({ mockUseLegalDocuments: vi.fn() }));

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLegalDocuments: () => mockUseLegalDocuments(),
    usePublishLegalDocument: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  };
});

const { mockHasPermission } = vi.hoisted(() => ({ mockHasPermission: vi.fn() }));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

const mockDocuments: LegalDocumentDetailResponse[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    documentId: 'privacy-policy',
    version: 3,
    lifecycleStatus: 'Published',
    displayName: 'Privacy Policy',
    description: 'Our privacy policy',
    templateName: null,
    documentBlobId: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastModifiedAt: '2024-06-01T12:00:00Z',
    concurrencyStamp: 'stamp-1',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    documentId: 'terms-of-service',
    version: 1,
    lifecycleStatus: 'Draft',
    displayName: 'Terms of Service',
    description: null,
    templateName: 'tos-template',
    documentBlobId: null,
    createdAt: '2024-02-01T00:00:00Z',
    lastModifiedAt: '2024-05-15T09:30:00Z',
    concurrencyStamp: 'stamp-2',
  },
];

describe('LegalDocumentListPage', () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it('should render the page title and subtitle', () => {
    mockUseLegalDocuments.mockReturnValue({ data: mockDocuments, isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    expect(screen.getByText('Legal Documents')).toBeInTheDocument();
    expect(screen.getByText('Manage legal documents')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    mockUseLegalDocuments.mockReturnValue({ data: mockDocuments, isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    expect(document.querySelector('[data-slot="legal-document-list-page"]')).toBeInTheDocument();
  });

  it('should render the create button when the user can create', () => {
    mockUseLegalDocuments.mockReturnValue({ data: mockDocuments, isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    expect(screen.getByText('New Document')).toBeInTheDocument();
  });

  it('should hide the create button when the user lacks permission', () => {
    mockHasPermission.mockReturnValue(false);
    mockUseLegalDocuments.mockReturnValue({ data: mockDocuments, isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    expect(screen.queryByText('New Document')).not.toBeInTheDocument();
  });

  it('should render document rows after loading', async () => {
    mockUseLegalDocuments.mockReturnValue({ data: mockDocuments, isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('privacy-policy')).toBeInTheDocument();
  });

  it('should render the column headers', () => {
    mockUseLegalDocuments.mockReturnValue({ data: mockDocuments, isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    expect(screen.getByText('Document ID')).toBeInTheDocument();
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should show the loading spinner while fetching', () => {
    mockUseLegalDocuments.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<LegalDocumentListPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('No documents found')).not.toBeInTheDocument();
  });

  it('should show the empty state when there are no documents', () => {
    mockUseLegalDocuments.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<LegalDocumentListPage />);
    expect(screen.getByText('No documents found')).toBeInTheDocument();
  });
});
