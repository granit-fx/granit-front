import { screen } from '@testing-library/react';

import { DocumentDetailPage } from '../components/document-detail-page';

import { renderWithProviders } from './test-utils';

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

// Grant all permissions so the manage-only controls render.
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

// These package components self-fetch / need providers — stub to markers.
vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    DocumentDetail: ({ documentId }: { documentId: string }) => (
      <div data-testid="document-detail" data-document-id={documentId} />
    ),
    VersionsTimeline: () => <div data-testid="versions-timeline" />,
    ShareDialog: () => <div data-testid="share-dialog" />,
  };
});

vi.mock('@granit/react-taxonomy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    DocumentTagChipStrip: () => <div data-testid="tag-chip-strip" />,
    CategorySelector: () => <div data-testid="category-selector" />,
  };
});

describe('DocumentDetailPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the not-found state when the id param is missing', () => {
    mockUseParams.mockReturnValue({});
    renderWithProviders(<DocumentDetailPage />);
    expect(document.querySelector('[data-slot="document-detail-page"]')).toBeInTheDocument();
    expect(screen.getByText('Document not found.')).toBeInTheDocument();
  });

  it('renders the page data-slot and detail when an id is present', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    renderWithProviders(<DocumentDetailPage />, { route: '/documents/doc-1' });
    expect(document.querySelector('[data-slot="document-detail-page"]')).toBeInTheDocument();
    expect(screen.getByTestId('document-detail')).toHaveAttribute('data-document-id', 'doc-1');
  });

  it('renders navigation buttons to the document sub-pages', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    renderWithProviders(<DocumentDetailPage />, { route: '/documents/doc-1' });
    expect(screen.getByRole('link', { name: 'Properties' })).toHaveAttribute(
      'href',
      '/documents/doc-1/metadata'
    );
    expect(screen.getByRole('link', { name: 'Public Links' })).toHaveAttribute(
      'href',
      '/documents/doc-1/public-links'
    );
    expect(screen.getByRole('link', { name: 'Renditions' })).toHaveAttribute(
      'href',
      '/documents/doc-1/renditions'
    );
  });

  it('mounts taxonomy and versions widgets', () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    renderWithProviders(<DocumentDetailPage />, { route: '/documents/doc-1' });
    expect(screen.getByTestId('tag-chip-strip')).toBeInTheDocument();
    expect(screen.getByTestId('category-selector')).toBeInTheDocument();
    expect(screen.getByTestId('versions-timeline')).toBeInTheDocument();
  });

  it('toggles the share dialog open when the Shares button is clicked', async () => {
    mockUseParams.mockReturnValue({ id: 'doc-1' });
    const { user } = renderWithProviders(<DocumentDetailPage />, { route: '/documents/doc-1' });
    expect(screen.queryByTestId('share-dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Shares' }));
    expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
  });
});
