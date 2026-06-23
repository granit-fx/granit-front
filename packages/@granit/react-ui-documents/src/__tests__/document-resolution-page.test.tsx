import { screen } from '@testing-library/react';

import { DocumentResolutionPage } from '../document-resolution-page';

import { renderWithProviders } from './test-utils';

import type { ResolvedDocumentResponse } from '@granit/documents';

const { mockMutate, mockUseBatchResolve } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseBatchResolve: vi.fn(),
}));

vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useBatchResolveDocumentAssets: mockUseBatchResolve,
    formatBytes: (n: number) => `${String(n)} B`,
  };
});

const mockResolved: ResolvedDocumentResponse = {
  documentId: 'doc-1',
  versionId: 'ver-1',
  url: 'https://cdn.example.com/doc-1.webp',
  width: 800,
  height: 600,
  mimeType: 'image/webp',
  sizeBytes: 4096,
  lastModified: '2026-01-01T00:00:00Z',
};

function resolveState(overrides: Record<string, unknown> = {}) {
  return {
    mutate: mockMutate,
    isPending: false,
    data: undefined,
    error: null,
    ...overrides,
  };
}

describe('DocumentResolutionPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the page data-slot, title and inputs', () => {
    mockUseBatchResolve.mockReturnValue(resolveState());
    renderWithProviders(<DocumentResolutionPage />);
    expect(document.querySelector('[data-slot="document-resolution-page"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Asset Resolution' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });

  it('renders the error state', () => {
    mockUseBatchResolve.mockReturnValue(resolveState({ error: new Error('boom') }));
    renderWithProviders(<DocumentResolutionPage />);
    expect(screen.getByText('Resolution failed.')).toBeInTheDocument();
  });

  it('renders the empty state when resolution returns no assets', () => {
    mockUseBatchResolve.mockReturnValue(resolveState({ data: [] }));
    renderWithProviders(<DocumentResolutionPage />);
    expect(
      screen.getByText(
        'No assets resolved. Check that the document IDs exist and have a current version.'
      )
    ).toBeInTheDocument();
  });

  it('renders a results table of resolved assets', () => {
    mockUseBatchResolve.mockReturnValue(resolveState({ data: [mockResolved] }));
    renderWithProviders(<DocumentResolutionPage />);
    expect(screen.getByText('doc-1')).toBeInTheDocument();
    expect(screen.getByText('image/webp')).toBeInTheDocument();
    expect(screen.getByText('800 × 600')).toBeInTheDocument();
    expect(screen.getByText('4096 B')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: mockResolved.url })).toHaveAttribute(
      'href',
      mockResolved.url
    );
  });

  it('calls the resolve mutation with parsed ids', async () => {
    mockUseBatchResolve.mockReturnValue(resolveState());
    const { user } = renderWithProviders(<DocumentResolutionPage />);
    await user.type(screen.getByLabelText(/Document IDs/), 'doc-1, doc-2');
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(mockMutate).toHaveBeenCalledWith({
      requests: [{ documentId: 'doc-1' }, { documentId: 'doc-2' }],
    });
  });
});
