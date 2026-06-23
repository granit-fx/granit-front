import { screen } from '@testing-library/react';

import { DocumentsExplorerPage } from '../documents-explorer-page';

import { renderWithProviders } from './test-utils';

import type { DocumentsExplorerLabels } from '@granit/react-documents';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// The page gates management actions on usePermissions, which otherwise needs an
// Axios client from a GranitClientProvider — stub it (matches the other UI packages).
const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(() => true),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

// The explorer and quota badge self-fetch and need package providers — stub them
// to markers. The explorer stub additionally exercises the label callbacks (the
// page builds them in a useMemo) and the onOpenDocument navigate wiring.
const { mockOnOpen } = vi.hoisted(() => ({
  mockOnOpen: { current: undefined as ((id: string) => void) | undefined },
}));

vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    DocumentsExplorer: ({
      canManage,
      canTransferOwnership,
      labels,
      onOpenDocument,
    }: {
      canManage: boolean;
      canTransferOwnership: boolean;
      labels: DocumentsExplorerLabels;
      onOpenDocument: (id: string) => void;
    }) => {
      mockOnOpen.current = onOpenDocument;
      // Invoke every function-valued label so the callbacks inside the memo run.
      const fnLabels = [
        labels.inspectorMultiple(3),
        labels.toolbar.oneSelected('NDA.pdf'),
        labels.toolbar.manySelected(2),
        labels.toolbar.bulkTrashConfirm(2),
        labels.dropZone.uploadingCount(1, 4),
        labels.quickLook.unsupportedKind('zip'),
        labels.quickLook.position(1, 3),
      ].join('|');
      return (
        <div
          data-testid="documents-explorer"
          data-can-manage={String(canManage)}
          data-can-transfer={String(canTransferOwnership)}
        >
          <span data-testid="fn-labels">{fnLabels}</span>
          <button type="button" onClick={() => onOpenDocument('doc-42')}>
            open-doc
          </button>
        </div>
      );
    },
    QuotaBadge: () => <div data-testid="quota-badge" />,
  };
});

describe('DocumentsExplorerPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it('renders the page data-slot', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(document.querySelector('[data-slot="documents-explorer-page"]')).toBeInTheDocument();
  });

  it('renders the title and subtitle', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument();
    expect(
      screen.getByText('Browse, upload, and manage your tenant documents.')
    ).toBeInTheDocument();
  });

  it('mounts the explorer and quota badge', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(screen.getByTestId('documents-explorer')).toBeInTheDocument();
    expect(screen.getByTestId('quota-badge')).toBeInTheDocument();
  });

  it('builds the interpolated function labels', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    const labels = screen.getByTestId('fn-labels').textContent ?? '';
    expect(labels).toContain('3 documents selected.');
    expect(labels).toContain('Selected: NDA.pdf');
    expect(labels).toContain('2 selected');
    expect(labels).toContain('Move 2 item(s) to trash?');
    expect(labels).toContain('Uploading 1 / 4…');
    expect(labels).toContain('No preview available for zip files.');
    expect(labels).toContain('1 / 3');
  });

  it('grants management permissions when the host has them', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(screen.getByTestId('documents-explorer')).toHaveAttribute('data-can-manage', 'true');
    expect(screen.getByTestId('documents-explorer')).toHaveAttribute('data-can-transfer', 'true');
  });

  it('withholds management permissions when the host lacks them', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<DocumentsExplorerPage />);
    expect(screen.getByTestId('documents-explorer')).toHaveAttribute('data-can-manage', 'false');
    expect(screen.getByTestId('documents-explorer')).toHaveAttribute('data-can-transfer', 'false');
  });

  it('navigates to the document detail route on open', async () => {
    const { user } = renderWithProviders(<DocumentsExplorerPage />);
    await user.click(screen.getByRole('button', { name: 'open-doc' }));
    expect(mockNavigate).toHaveBeenCalledWith('/documents/doc-42');
  });
});
