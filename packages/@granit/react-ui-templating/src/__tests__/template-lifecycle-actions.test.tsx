import { screen, waitFor } from '@testing-library/react';

import { TemplateLifecycleActions } from '../components/template-lifecycle-actions';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';
import type { TemplateDetail, TemplateRevision } from '@granit/templating';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { publish, unpublish, deleteDraft } = vi.hoisted(() => ({
  publish: { mutateAsync: vi.fn() },
  unpublish: { mutateAsync: vi.fn() },
  deleteDraft: { mutateAsync: vi.fn() },
}));

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return {
    ...actual,
    useTemplateMutations: () => ({ publish, unpublish, deleteDraft }),
  };
});

function revision(status: TemplateRevision['status']): TemplateRevision {
  return {
    revisionId: 'r1' as TemplateRevision['revisionId'],
    content: 'x',
    mimeType: 'text/html',
    status,
    layoutName: null,
    createdAt: '2026-06-01T00:00:00Z' as TemplateRevision['createdAt'],
    createdBy: 'admin',
    publishedAt: null,
    publishedBy: null,
    concurrencyStamp: 'stamp',
  };
}

function detail(overrides: Partial<TemplateDetail>): TemplateDetail {
  return {
    name: 'welcome',
    culture: null,
    layoutName: null,
    draft: null,
    published: null,
    ...overrides,
  };
}

describe('TemplateLifecycleActions', () => {
  beforeEach(() => {
    publish.mutateAsync.mockResolvedValue(undefined);
    unpublish.mutateAsync.mockResolvedValue(undefined);
    deleteDraft.mutateAsync.mockResolvedValue(undefined);
  });
  afterEach(() => vi.clearAllMocks());

  it('should show publish and delete-draft actions when a draft exists', () => {
    renderWithProviders(
      <TemplateLifecycleActions template={detail({ draft: revision('Draft') })} />
    );
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete draft' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unpublish' })).not.toBeInTheDocument();
  });

  it('should show unpublish action when published exists', () => {
    renderWithProviders(
      <TemplateLifecycleActions template={detail({ published: revision('Published') })} />
    );
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  });

  it('should publish after confirming', async () => {
    const { user } = renderWithProviders(
      <TemplateLifecycleActions template={detail({ name: 'welcome', draft: revision('Draft') })} />
    );
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(publish.mutateAsync).toHaveBeenCalledWith({ name: 'welcome', culture: undefined })
    );
  });

  it('should unpublish after confirming', async () => {
    const { user } = renderWithProviders(
      <TemplateLifecycleActions
        template={detail({ name: 'welcome', culture: 'fr', published: revision('Published') })}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Unpublish' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(unpublish.mutateAsync).toHaveBeenCalledWith({ name: 'welcome', culture: 'fr' })
    );
  });

  it('should delete the draft after confirming', async () => {
    const { user } = renderWithProviders(
      <TemplateLifecycleActions template={detail({ draft: revision('Draft') })} />
    );
    await user.click(screen.getByRole('button', { name: 'Delete draft' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(deleteDraft.mutateAsync).toHaveBeenCalled());
  });

  it('should close the dialog without mutating when cancelled', async () => {
    const { user } = renderWithProviders(
      <TemplateLifecycleActions template={detail({ draft: revision('Draft') })} />
    );
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    );
    expect(publish.mutateAsync).not.toHaveBeenCalled();
  });

  it('should log when a mutation rejects', async () => {
    const { logger } = await import('../logger');
    publish.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(
      <TemplateLifecycleActions template={detail({ draft: revision('Draft') })} />
    );
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });
});
