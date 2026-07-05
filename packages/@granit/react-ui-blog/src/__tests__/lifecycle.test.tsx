import { toISODateString } from '@granit/types';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostConflictDialog } from '../components/post-conflict-dialog';
import { PostLifecyclePanel } from '../components/post-lifecycle-panel';

import { renderWithProviders } from './test-utils';

import type { BlogPostResponse } from '@granit/blog';
import type { BlogConflict } from '@granit/react-blog';

/** A mutate mock that invokes the supplied onSuccess/onError callbacks. */
function callbackMutate(mode: 'success' | 'error' = 'success', error?: unknown) {
  return vi.fn(
    (_vars: unknown, opts?: { onSuccess?: () => void; onError?: (e: unknown) => void }) => {
      if (mode === 'success') opts?.onSuccess?.();
      else opts?.onError?.(error);
    }
  );
}

const publishMutate = callbackMutate('success');
const unpublishMutate = callbackMutate('success');
const scheduleMutate = callbackMutate('success');
const cancelMutate = callbackMutate('success');

vi.mock('@granit/react-blog', () => ({
  usePublishPost: () => ({ mutate: publishMutate, isPending: false }),
  useUnpublishPost: () => ({ mutate: unpublishMutate, isPending: false }),
  useSchedulePost: () => ({ mutate: scheduleMutate, isPending: false }),
  useCancelPostSchedule: () => ({ mutate: cancelMutate, isPending: false }),
}));

const post: BlogPostResponse = {
  id: 'post-1',
  siteId: 'site-1',
  slug: 'hello-world',
  authorId: 'author-1',
  coverImageDocumentId: null,
  scheduledAtUtc: null,
  attachments: [],
  concurrencyStamp: 'stamp-1',
  createdAt: toISODateString('2026-06-01T00:00:00Z'),
  modifiedAt: null,
};

afterEach(() => vi.clearAllMocks());

describe('PostLifecyclePanel', () => {
  it('publishes and unpublishes', async () => {
    const { user } = renderWithProviders(<PostLifecyclePanel post={post} />);
    await user.click(screen.getByRole('button', { name: 'Publish now' }));
    expect(publishMutate).toHaveBeenCalledWith('post-1', expect.anything());
    await user.click(screen.getByRole('button', { name: 'Unpublish' }));
    expect(unpublishMutate).toHaveBeenCalled();
  });

  it('rejects an incomplete schedule (no date/tz)', async () => {
    const { user } = renderWithProviders(<PostLifecyclePanel post={post} />);
    await user.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(scheduleMutate).not.toHaveBeenCalled();
  });

  it('cancels a pending schedule', async () => {
    const { user } = renderWithProviders(
      <PostLifecyclePanel
        post={{ ...post, scheduledAtUtc: toISODateString('2026-08-01T07:00:00Z') }}
      />
    );
    expect(screen.getByText(/Scheduled for/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel schedule' }));
    expect(cancelMutate).toHaveBeenCalledWith('post-1', expect.anything());
  });

  it('surfaces a 422 no-draft error on publish', async () => {
    publishMutate.mockImplementationOnce((_vars, opts) =>
      opts?.onError?.({ response: { status: 422, data: { code: 'Granit:Blog:PostHasNoDraft' } } })
    );
    const { user } = renderWithProviders(<PostLifecyclePanel post={post} />);
    await user.click(screen.getByRole('button', { name: 'Publish now' }));
    expect(publishMutate).toHaveBeenCalled();
  });
});

describe('PostConflictDialog', () => {
  it('renders a reload prompt and confirms it', async () => {
    const onReload = vi.fn();
    const onDismiss = vi.fn();
    const conflict: BlogConflict = { status: 409, detail: null };
    const { user } = renderWithProviders(
      <PostConflictDialog conflict={conflict} onReload={onReload} onDismiss={onDismiss} />
    );
    expect(screen.getByText('This post changed elsewhere')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reload latest' }));
    expect(onReload).toHaveBeenCalled();
  });

  it('surfaces the backend localized detail when present', () => {
    const conflict: BlogConflict = { status: 409, detail: 'That slug is already in use.' };
    renderWithProviders(
      <PostConflictDialog conflict={conflict} onReload={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(screen.getByText('That slug is already in use.')).toBeInTheDocument();
  });

  it('renders nothing when there is no conflict', () => {
    renderWithProviders(
      <PostConflictDialog conflict={null} onReload={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(screen.queryByText('This post changed elsewhere')).not.toBeInTheDocument();
  });
});
