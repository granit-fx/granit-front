import { screen, waitFor } from '@testing-library/react';

import { TemplateHistory } from '../components/template-history';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';
import type {
  TemplateHistory as TemplateHistoryData,
  TemplateRevisionSummary,
} from '@granit/templating';
import type * as Templating from '@granit/templating';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { mockUseHistory, saveDraft } = vi.hoisted(() => ({
  mockUseHistory: vi.fn(),
  saveDraft: { mutateAsync: vi.fn() },
}));

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return {
    ...actual,
    useTemplateHistory: mockUseHistory,
    useTemplateMutations: () => ({ saveDraft }),
    useTemplatingConfig: () => ({ client: {}, basePath: '/templating', queryKeyPrefix: ['t'] }),
  };
});

const { mockGetRevision } = vi.hoisted(() => ({ mockGetRevision: vi.fn() }));

vi.mock('@granit/templating', async () => {
  const actual = await vi.importActual<typeof Templating>('@granit/templating');
  return { ...actual, getRevision: mockGetRevision };
});

function summary(id: string, status: TemplateRevisionSummary['status']): TemplateRevisionSummary {
  return {
    revisionId: id as TemplateRevisionSummary['revisionId'],
    status,
    createdAt: '2026-06-01T10:00:00Z' as TemplateRevisionSummary['createdAt'],
    createdBy: 'admin',
    publishedAt:
      status === 'Published'
        ? ('2026-06-02T10:00:00Z' as TemplateRevisionSummary['publishedAt'])
        : null,
    publishedBy: status === 'Published' ? 'publisher' : null,
    contentLength: 42,
  };
}

function history(revisions: TemplateRevisionSummary[]): TemplateHistoryData {
  return { revisions, totalCount: revisions.length, page: 1, pageSize: 25 };
}

describe('TemplateHistory', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render loading skeletons while loading', () => {
    mockUseHistory.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(<TemplateHistory templateName="welcome" />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('should show a no-results message when there are no revisions', () => {
    mockUseHistory.mockReturnValue({ data: history([]), isLoading: false });
    renderWithProviders(<TemplateHistory templateName="welcome" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('should render the revision entries', () => {
    mockUseHistory.mockReturnValue({
      data: history([summary('aaaaaaaa1111', 'Published'), summary('bbbbbbbb2222', 'Draft')]),
      isLoading: false,
    });
    renderWithProviders(<TemplateHistory templateName="welcome" />);
    expect(screen.getAllByText('admin').length).toBe(2);
    expect(screen.getByText('publisher', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('aaaaaaaa')).toBeInTheDocument();
  });

  it('should offer a restore action only for archived/published revisions', () => {
    mockUseHistory.mockReturnValue({
      data: history([summary('aaaaaaaa1111', 'Published'), summary('bbbbbbbb2222', 'Draft')]),
      isLoading: false,
    });
    renderWithProviders(<TemplateHistory templateName="welcome" />);
    expect(screen.getAllByRole('button', { name: 'Restore this version' })).toHaveLength(1);
  });

  it('should restore a revision after confirming', async () => {
    mockUseHistory.mockReturnValue({
      data: history([summary('aaaaaaaa1111', 'Published')]),
      isLoading: false,
    });
    mockGetRevision.mockResolvedValue({ content: 'restored', mimeType: 'text/html' });
    saveDraft.mutateAsync.mockResolvedValue(undefined);

    const { user } = renderWithProviders(<TemplateHistory templateName="welcome" culture="fr" />);
    await user.click(screen.getByRole('button', { name: 'Restore this version' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(mockGetRevision).toHaveBeenCalled());
    await waitFor(() =>
      expect(saveDraft.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'welcome', culture: 'fr', content: 'restored' })
      )
    );
  });

  it('should select two revisions and trigger onCompare', async () => {
    mockUseHistory.mockReturnValue({
      data: history([summary('aaaaaaaa1111', 'Published'), summary('bbbbbbbb2222', 'Draft')]),
      isLoading: false,
    });
    const onCompare = vi.fn();
    const { user } = renderWithProviders(
      <TemplateHistory templateName="welcome" onCompare={onCompare} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]!);
    await user.click(checkboxes[1]!);
    await user.click(await screen.findByRole('button', { name: 'Compare' }));
    expect(onCompare).toHaveBeenCalledWith('aaaaaaaa1111', 'bbbbbbbb2222');
  });

  it('should deselect a revision when its checkbox is unchecked', async () => {
    mockUseHistory.mockReturnValue({
      data: history([summary('aaaaaaaa1111', 'Published'), summary('bbbbbbbb2222', 'Draft')]),
      isLoading: false,
    });
    const onCompare = vi.fn();
    const { user } = renderWithProviders(
      <TemplateHistory templateName="welcome" onCompare={onCompare} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]!);
    await user.click(checkboxes[1]!);
    await user.click(checkboxes[0]!);
    expect(screen.queryByRole('button', { name: 'Compare' })).not.toBeInTheDocument();
  });

  it('should log when restore fails', async () => {
    const { logger } = await import('../logger');
    mockUseHistory.mockReturnValue({
      data: history([summary('aaaaaaaa1111', 'Archived')]),
      isLoading: false,
    });
    mockGetRevision.mockRejectedValueOnce(new Error('nope'));
    const { user } = renderWithProviders(<TemplateHistory templateName="welcome" />);
    await user.click(screen.getByRole('button', { name: 'Restore this version' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });
});
