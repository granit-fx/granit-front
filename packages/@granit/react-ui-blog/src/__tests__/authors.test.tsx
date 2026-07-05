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
  userId: '11111111-1111-4111-8111-111111111111',
  displayName: 'Ada Lovelace',
  bio: null,
  avatarDocumentId: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

const deleteMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
const createMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock('@granit/react-blog', () => ({
  useAuthors: () => ({ data: [author], isLoading: false, isError: false }),
  useAuthor: () => ({ data: undefined, isLoading: false }),
  useCreateAuthor: () => ({ mutate: createMutate, isPending: false }),
  useUpdateAuthor: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAuthor: () => ({ mutate: deleteMutate }),
}));

vi.mock('@granit/react-documents', () => ({ DocumentSearchPalette: () => null }));

afterEach(() => vi.clearAllMocks());

describe('AuthorsListPage', () => {
  it('lists authors and confirms deletion', async () => {
    const onNewAuthor = vi.fn();
    const { user } = renderWithProviders(
      <AuthorsListPage siteId="site-1" onNewAuthor={onNewAuthor} />
    );
    expect(screen.getByRole('heading', { name: 'Authors' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const confirmButtons = await screen.findAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]!);
    expect(deleteMutate).toHaveBeenCalledWith(
      { id: 'author-1', siteId: 'site-1' },
      expect.anything()
    );
  });
});

describe('AuthorFormPage', () => {
  it('renders create fields and submits a new author', async () => {
    const { user } = renderWithProviders(<AuthorFormPage siteId="site-1" onDone={vi.fn()} />);
    await user.type(screen.getByLabelText('User'), '22222222-2222-4222-8222-222222222222');
    await user.type(screen.getByLabelText('Display name'), 'Grace Hopper');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          siteId: 'site-1',
          request: expect.objectContaining({ displayName: 'Grace Hopper' }),
        }),
        expect.anything()
      )
    );
  });
});
