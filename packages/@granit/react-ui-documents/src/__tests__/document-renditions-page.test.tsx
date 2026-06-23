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

const { mockUseDocumentRenditions, mockRefetch, mockUseRenditionDownloadUrl } = vi.hoisted(() => ({
  mockUseDocumentRenditions: vi.fn(),
  mockRefetch: vi.fn(),
  mockUseRenditionDownloadUrl: vi.fn(),
}));

vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDocumentRenditions: mockUseDocumentRenditions,
    useRenditionDownloadUrl: mockUseRenditionDownloadUrl,
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
  beforeEach(() => {
    mockUseRenditionDownloadUrl.mockReturnValue({ isFetching: false, refetch: mockRefetch });
  });
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

  it('shows a dash for renditions missing dimensions and size', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: {
        documentId: 'doc-1',
        documentVersionId: 'ver-1',
        renditions: [
          {
            ...mockRendition,
            id: 'rend-2',
            status: 'Generating',
            width: null,
            height: null,
            sizeBytes: null,
          },
        ],
      },
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Generating')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('renders a Failed status badge', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: {
        documentId: 'doc-1',
        documentVersionId: 'ver-1',
        renditions: [{ ...mockRendition, id: 'rend-3', status: 'Failed' }],
      },
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders an unknown status with the default badge style', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: {
        documentId: 'doc-1',
        documentVersionId: 'ver-1',
        renditions: [
          { ...mockRendition, id: 'rend-4', status: 'Pending' as RenditionResponse['status'] },
        ],
      },
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('opens the rendition download url in a new tab when the download succeeds', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
    });
    mockRefetch.mockResolvedValue({ data: { url: 'https://cdn.example.com/r.webp' } });
    const openSpy = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    const { user } = renderWithProviders(<DocumentRenditionsPage />, {
      route: '/documents/doc-1/renditions',
    });
    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(mockRefetch).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'https://cdn.example.com/r.webp',
      '_blank',
      'noopener,noreferrer'
    );
    openSpy.mockRestore();
  });

  it('does not open a tab when the download refetch returns no data', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
    });
    mockRefetch.mockResolvedValue({ data: undefined });
    const openSpy = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    const { user } = renderWithProviders(<DocumentRenditionsPage />, {
      route: '/documents/doc-1/renditions',
    });
    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(mockRefetch).toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('shows the fetching label while a download is in flight', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
    });
    mockUseRenditionDownloadUrl.mockReturnValue({ isFetching: true, refetch: mockRefetch });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByRole('button', { name: 'Fetching…' })).toBeInTheDocument();
  });

  it('renders the version id footer', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    mockUseDocumentRenditions.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
    });
    renderWithProviders(<DocumentRenditionsPage />, { route: '/documents/doc-1/renditions' });
    expect(screen.getByText('Version: ver-1')).toBeInTheDocument();
  });
});
