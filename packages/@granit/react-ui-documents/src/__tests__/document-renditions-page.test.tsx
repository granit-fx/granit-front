import { screen } from '@testing-library/react';

import { DocumentRenditionsPage } from '../document-renditions-page';

import { renderWithProviders } from './test-utils';

import type { ListRenditionsResponse, RenditionResponse } from '@granit/documents';

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

const { mockUseDocumentRenditions } = vi.hoisted(() => ({
  mockUseDocumentRenditions: vi.fn(),
}));

vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDocumentRenditions: mockUseDocumentRenditions,
    useRenditionDownloadUrl: () => ({ isFetching: false, refetch: vi.fn() }),
    formatBytes: (n: number) => `${String(n)} B`,
  };
});

const mockRendition: RenditionResponse = {
  id: 'rend-1',
  documentId: 'doc-1',
  documentVersionId: 'ver-1',
  type: 'Thumbnail',
  format: 'image/webp',
  status: 'Ready',
  sizeBytes: 2048,
  width: 320,
  height: 240,
  createdAt: '2026-01-01T00:00:00Z',
  completedAt: '2026-01-01T00:01:00Z',
  failureReason: null,
};

const mockResponse: ListRenditionsResponse = {
  documentId: 'doc-1',
  documentVersionId: 'ver-1',
  renditions: [mockRendition],
};

describe('DocumentRenditionsPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the not-found state when the id param is missing', () => {
    mockUseParams.mockReturnValue({});
    mockUseDocumentRenditions.mockReturnValue({ data: undefined, isLoading: false, error: null });
    renderWithProviders(<DocumentRenditionsPage />);
    expect(document.querySelector('[data-slot="document-renditions-page"]')).toBeInTheDocument();
    expect(screen.getByText('Document not found.')).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Loading renditions…')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Failed to load renditions.')).toBeInTheDocument();
  });

  it('renders the empty state when there are no renditions', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: { documentId: 'doc-1', documentVersionId: 'ver-1', renditions: [] },
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('No renditions available.')).toBeInTheDocument();
  });

  it('renders a renditions table with type, status, dimensions and size', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();
    expect(screen.getByText('image/webp')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('320 × 240')).toBeInTheDocument();
    expect(screen.getByText('2048 B')).toBeInTheDocument();
  });
});
