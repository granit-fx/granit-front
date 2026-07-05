import { toISODateString } from '@granit/types';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostEditorPage } from '../components/post-editor-page';

import { renderWithProviders } from './test-utils';

import type { BlogPostResponse } from '@granit/blog';

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

vi.mock('@granit/react-blog', () => ({
  usePost: (id: string) => ({ data: id ? post : undefined, isLoading: false }),
  extractBlogConflict: () => null,
  useBlogConfig: () => ({ client: {}, basePath: '/api/blog', cmsBasePath: '/api/cms' }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// Stub the heavy sub-panels — their own units are tested separately.
vi.mock('../components/post-metadata-form', () => ({
  PostMetadataForm: () => <div data-testid="metadata-form" />,
}));
vi.mock('../components/post-content-editor', () => ({
  PostContentEditor: () => <div data-testid="content-editor" />,
}));
vi.mock('../components/post-gallery-editor', () => ({
  PostGalleryEditor: () => <div data-testid="gallery-editor" />,
}));
vi.mock('../components/post-lifecycle-panel', () => ({
  PostLifecyclePanel: () => <div data-testid="lifecycle-panel" />,
}));
vi.mock('../components/post-conflict-dialog', () => ({
  PostConflictDialog: () => <div data-testid="conflict-dialog" />,
}));

afterEach(() => vi.clearAllMocks());

describe('PostEditorPage', () => {
  it('shows only the metadata form in create mode', () => {
    renderWithProviders(<PostEditorPage siteId="site-1" />);
    expect(screen.getByRole('heading', { name: 'New post' })).toBeInTheDocument();
    expect(screen.getByTestId('metadata-form')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('shows the four editing tabs in edit mode', () => {
    renderWithProviders(<PostEditorPage postId="post-1" />);
    expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Content' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Media' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Lifecycle' })).toBeInTheDocument();
    expect(screen.getByTestId('conflict-dialog')).toBeInTheDocument();
  });
});
