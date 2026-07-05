import { toISODateString } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthorFormPage } from '../components/author-form-page';
import { AuthorsListPage } from '../components/authors-list-page';

import { renderWithProviders } from './test-utils';

import type { BlogAuthorProfileResponse } from '@granit/blog';

const author: BlogAuthorProfileResponse = {
  id: 'author-1',
  siteId: 'site-1',
  userId: 'user-1',
  displayName: 'Ada Lovelace',
  bio: 'Bio',
  avatarDocumentId: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

const updateMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => false }),
}));

vi.mock('@granit/react-blog', () => ({
  useAuthors: () => ({ data: [], isLoading: false, isError: false }),
  useAuthor: () => ({ data: author, isLoading: false }),
  useCreateAuthor: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateAuthor: () => ({ mutate: updateMutate, isPending: false }),
  useDeleteAuthor: () => ({ mutate: vi.fn() }),
}));

vi.mock('@granit/react-documents', () => ({ DocumentSearchPalette: () => null }));

afterEach(() => vi.clearAllMocks());

describe('AuthorFormPage (edit)', () => {
  it('loads the author and submits an update (no userId field)', async () => {
    const { user } = renderWithProviders(
      <AuthorFormPage siteId="site-1" authorId="author-1" onDone={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByLabelText('Display name')).toHaveValue('Ada Lovelace'));
    expect(screen.queryByLabelText('User')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(updateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'author-1' }),
        expect.anything()
      )
    );
  });
});

describe('AuthorsListPage (read-only + empty)', () => {
  it('hides management actions and shows the empty state', () => {
    renderWithProviders(<AuthorsListPage siteId="site-1" />);
    expect(screen.getByText('No authors yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New author/ })).not.toBeInTheDocument();
  });
});
