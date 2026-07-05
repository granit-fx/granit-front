import { toISODateString } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostGalleryEditor } from '../components/post-gallery-editor';
import { PostMetadataForm } from '../components/post-metadata-form';

import { renderWithProviders } from './test-utils';

import type { BlogAuthorProfileResponse, BlogPostResponse } from '@granit/blog';

const author: BlogAuthorProfileResponse = {
  id: 'author-1',
  siteId: 'site-1',
  userId: 'user-1',
  displayName: 'Ada Lovelace',
  bio: null,
  avatarDocumentId: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

const createMutate = vi.fn((_v: unknown, opts?: { onSuccess?: (d: unknown) => void }) =>
  opts?.onSuccess?.({ id: 'new-post' })
);
const removeMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
const saveAttMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.()
);
const reorderMutate = vi.fn();

const updateMutate = vi.fn((_v: unknown, opts?: { onSuccess?: (d: unknown) => void }) =>
  opts?.onSuccess?.({ id: 'post-1' })
);

vi.mock('@granit/react-blog', () => ({
  useAuthors: () => ({ data: [author] }),
  useCreatePost: () => ({ mutate: createMutate, isPending: false }),
  useUpdatePost: () => ({ mutate: updateMutate, isPending: false }),
  useAddPostAttachment: () => ({ mutate: vi.fn() }),
  useUpdatePostAttachment: () => ({ mutate: saveAttMutate }),
  useRemovePostAttachment: () => ({ mutate: removeMutate }),
  useReorderPostAttachments: () => ({ mutate: reorderMutate }),
}));

vi.mock('@granit/react-documents', () => ({ DocumentSearchPalette: () => null }));

const post: BlogPostResponse = {
  id: 'post-1',
  siteId: 'site-1',
  slug: 'hello-world',
  authorId: 'author-1',
  coverImageDocumentId: null,
  scheduledAtUtc: null,
  attachments: [
    { documentId: 'doc-1', caption: 'One', altText: null, sortOrder: 0 },
    { documentId: 'doc-2', caption: null, altText: null, sortOrder: 1 },
  ],
  concurrencyStamp: 'stamp-1',
  createdAt: toISODateString('2026-06-01T00:00:00Z'),
  modifiedAt: null,
};

afterEach(() => vi.clearAllMocks());

describe('PostMetadataForm', () => {
  it('renders slug, author and cover fields in create mode', () => {
    renderWithProviders(<PostMetadataForm siteId="site-1" />);
    expect(screen.getByLabelText('Slug')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Cover image')).toBeInTheDocument();
  });

  it('creates a post with the selected author', async () => {
    const { user } = renderWithProviders(<PostMetadataForm siteId="site-1" />);
    await user.type(screen.getByLabelText('Slug'), 'grace-hopper');
    await user.click(screen.getByLabelText('Author'));
    await user.click(await screen.findByRole('option', { name: 'Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          siteId: 'site-1',
          request: expect.objectContaining({ slug: 'grace-hopper', authorId: 'author-1' }),
        }),
        expect.anything()
      )
    );
  });

  it('submits an edit and reports the saved post', async () => {
    const onSaved = vi.fn();
    const { user } = renderWithProviders(
      <PostMetadataForm siteId="site-1" post={post} onConflict={vi.fn()} onSaved={onSaved} />
    );
    await waitFor(() => expect(screen.getByLabelText('Slug')).toHaveValue('hello-world'));
    // Re-affirm the author selection (Radix Select does not reflect a reset value
    // until an item is registered) so the form validates on submit.
    await user.click(screen.getByLabelText('Author'));
    await user.click(await screen.findByRole('option', { name: 'Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(updateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'post-1',
          request: expect.objectContaining({ concurrencyStamp: 'stamp-1' }),
        }),
        expect.anything()
      )
    );
    expect(onSaved).toHaveBeenCalled();
  });
});

describe('PostGalleryEditor', () => {
  it('lists attachments and reorders via the full ordered set', async () => {
    const { user } = renderWithProviders(<PostGalleryEditor post={post} />);
    expect(screen.getAllByLabelText('Caption')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Move down' })[0]!);
    expect(reorderMutate).toHaveBeenCalledWith({
      id: 'post-1',
      request: { documentIdsInOrder: ['doc-2', 'doc-1'] },
    });
  });

  it('saves and removes an attachment', async () => {
    const { user } = renderWithProviders(<PostGalleryEditor post={post} />);
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]!);
    expect(saveAttMutate).toHaveBeenCalled();
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    expect(removeMutate).toHaveBeenCalledWith(
      { id: 'post-1', documentId: 'doc-1' },
      expect.anything()
    );
  });

  it('shows an empty state with no attachments', () => {
    renderWithProviders(<PostGalleryEditor post={{ ...post, attachments: [] }} />);
    expect(screen.getByText('No attachments yet.')).toBeInTheDocument();
  });
});
