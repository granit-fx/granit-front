import { screen, waitFor } from '@testing-library/react';

import { LegalDocumentEditPage } from '../legal-documents/legal-document-edit-page';

import { renderWithProviders } from './test-utils';

import type { LegalDocumentDetailResponse } from '@granit/privacy';

const { mockUseParams } = vi.hoisted(() => ({ mockUseParams: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

const { mockUseLegalDocument } = vi.hoisted(() => ({ mockUseLegalDocument: vi.fn() }));

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLegalDocument: () => mockUseLegalDocument(),
    useUpdateLegalDocument: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const documentId = '11111111-1111-1111-1111-111111111111';

const mockDocument: LegalDocumentDetailResponse = {
  id: documentId,
  documentId: 'privacy-policy',
  version: 1,
  lifecycleStatus: 'Draft',
  displayName: 'Privacy Policy',
  description: 'Our privacy policy',
  templateName: 'pp-template',
  documentBlobId: '00000000-0000-0000-0000-000000000000',
  createdAt: '2024-01-01T00:00:00Z',
  lastModifiedAt: '2024-06-01T12:00:00Z',
  concurrencyStamp: 'stamp-1',
};

describe('LegalDocumentEditPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: documentId });
  });

  afterEach(() => vi.clearAllMocks());

  it('should display the loading spinner', () => {
    mockUseLegalDocument.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<LegalDocumentEditPage />, {
      route: `/privacy/legal-documents/${documentId}/edit`,
    });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display the not-found state when the document is missing', () => {
    mockUseLegalDocument.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<LegalDocumentEditPage />, {
      route: `/privacy/legal-documents/${documentId}/edit`,
    });
    expect(screen.getByText('Document not found')).toBeInTheDocument();
  });

  it('should render the edit title', () => {
    mockUseLegalDocument.mockReturnValue({ data: mockDocument, isLoading: false });
    renderWithProviders(<LegalDocumentEditPage />, {
      route: `/privacy/legal-documents/${documentId}/edit`,
    });
    expect(screen.getByText('Edit Legal Document')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    mockUseLegalDocument.mockReturnValue({ data: mockDocument, isLoading: false });
    renderWithProviders(<LegalDocumentEditPage />, {
      route: `/privacy/legal-documents/${documentId}/edit`,
    });
    expect(document.querySelector('[data-slot="legal-document-edit-page"]')).toBeInTheDocument();
  });

  it('should render the edit form with pre-filled values', async () => {
    mockUseLegalDocument.mockReturnValue({ data: mockDocument, isLoading: false });
    renderWithProviders(<LegalDocumentEditPage />, {
      route: `/privacy/legal-documents/${documentId}/edit`,
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Display Name')).toHaveValue('Privacy Policy');
    });
    expect(screen.getByLabelText('Template Name')).toHaveValue('pp-template');
    expect(screen.getByLabelText('Document Blob ID')).toHaveValue(
      '00000000-0000-0000-0000-000000000000'
    );
  });

  it('should not render the document id field in edit mode', () => {
    mockUseLegalDocument.mockReturnValue({ data: mockDocument, isLoading: false });
    renderWithProviders(<LegalDocumentEditPage />, {
      route: `/privacy/legal-documents/${documentId}/edit`,
    });
    expect(screen.queryByPlaceholderText('privacy-policy')).not.toBeInTheDocument();
  });
});
