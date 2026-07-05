import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPostsColumns } from '../components/posts-columns';
import { PostsListPage } from '../components/posts-list-page';

import { renderWithProviders } from './test-utils';

import type { BlogPostListItemResponse } from '@granit/blog';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactElement } from 'react';

const deleteMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock('@granit/react-blog', () => ({
  useBlogConfig: () => ({ client: {}, basePath: '/api/blog' }),
  usePostsQueryMeta: () => ({ data: { defaultSort: '-createdAt' } }),
  useDeletePost: () => ({ mutate: deleteMutate }),
}));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useQueryEndpoint: () => ({ query: { isError: false } }),
}));

vi.mock('@granit/react-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, QueryEndpointDataTable: () => <div data-testid="grid" /> };
});

afterEach(() => vi.clearAllMocks());

const t = ((_key: string, fallback?: string) => fallback ?? _key) as never;

const row = (
  over: Partial<BlogPostListItemResponse> = {}
): { original: BlogPostListItemResponse } => ({
  original: {
    id: 'post-1',
    siteId: 'site-1',
    slug: 'hello-world',
    authorId: 'author-1',
    coverImageDocumentId: null,
    scheduledAtUtc: null,
    createdAt: '2026-06-01T00:00:00Z',
    modifiedAt: null,
    ...over,
  },
});

function renderCell(
  column: ColumnDef<BlogPostListItemResponse, unknown>,
  ctx: { original: BlogPostListItemResponse }
) {
  const cell = column.cell as (c: unknown) => ReactElement;
  return renderWithProviders(<>{cell({ row: ctx })}</>);
}

describe('PostsListPage', () => {
  it('renders the header, new-post action and the grid', async () => {
    const onNewPost = vi.fn();
    const { user } = renderWithProviders(<PostsListPage onNewPost={onNewPost} />);
    expect(screen.getByRole('heading', { name: 'Posts' })).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /New post/ }));
    expect(onNewPost).toHaveBeenCalled();
  });
});

describe('createPostsColumns', () => {
  it('includes the actions column when canManage is true', () => {
    const columns = createPostsColumns({ t, onEdit: vi.fn(), onDelete: vi.fn(), canManage: true });
    expect(columns.map((c) => c.id)).toEqual(['slug', 'scheduledAtUtc', 'createdAt', 'actions']);
  });

  it('omits the actions column for read-only viewers', () => {
    const columns = createPostsColumns({ t, onEdit: vi.fn(), onDelete: vi.fn(), canManage: false });
    expect(columns.map((c) => c.id)).not.toContain('actions');
  });

  it('renders every cell and wires the edit/delete actions', async () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const columns = createPostsColumns({ t, onEdit, onDelete, canManage: true });

    renderCell(
      columns.find((c) => c.id === 'slug')!,
      row()
    );
    expect(screen.getByText('hello-world')).toBeInTheDocument();

    // Scheduled → shows the scheduled date badge branch.
    renderCell(
      columns.find((c) => c.id === 'scheduledAtUtc')!,
      row({ scheduledAtUtc: '2026-08-01T09:00:00Z' })
    );
    expect(screen.getByText('2026-08-01')).toBeInTheDocument();

    renderCell(
      columns.find((c) => c.id === 'createdAt')!,
      row()
    );
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();

    const { user } = renderCell(
      columns.find((c) => c.id === 'actions')!,
      row()
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalled();
  });
});
