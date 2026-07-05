import { toISODateString } from '@granit/types';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostContentEditor } from '../components/post-content-editor';

import { renderWithProviders } from './test-utils';

import type { BlogPostResponse } from '@granit/blog';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { categories: [] }, isError: false }),
}));

vi.mock('@granit/cms', () => ({ getBlockCatalog: vi.fn() }));

vi.mock('@granit/react-cms', () => ({
  useCmsConfig: () => ({ client: {}, basePath: '/api/cms' }),
  catalogToConfig: () => ({ components: {}, categories: {} }),
}));

const saveMutate = vi.fn((_v: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@granit/react-blog', () => ({
  registerBlogBlocks: (config: unknown) => config,
  useSaveDraftContent: () => ({ mutate: saveMutate }),
}));

vi.mock('@puckeditor/core', () => ({
  Puck: ({ onPublish }: { onPublish?: (data: unknown) => void }) => (
    <button data-testid="puck" onClick={() => onPublish?.({ content: [], root: { props: {} } })}>
      publish
    </button>
  ),
}));

const post: BlogPostResponse = {
  id: 'post-1',
  siteId: 'site-1',
  slug: 'hello-world',
  authorId: 'author-1',
  attachments: [],
  concurrencyStamp: 'stamp-1',
  createdAt: toISODateString('2026-06-01T00:00:00Z'),
};

afterEach(() => vi.clearAllMocks());

describe('PostContentEditor', () => {
  it('renders the culture switcher, title/summary and the embedded Puck editor', () => {
    renderWithProviders(<PostContentEditor post={post} cultures={['en', 'fr']} />);
    expect(screen.getByLabelText('Culture')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toBeInTheDocument();
    expect(screen.getByTestId('puck')).toBeInTheDocument();
  });

  it('saves the draft on publish with title, summary and the concurrency stamp', async () => {
    const { user } = renderWithProviders(<PostContentEditor post={post} cultures={['en']} />);
    await user.type(screen.getByLabelText('Title'), 'Hello');
    await user.type(screen.getByLabelText('Summary'), 'A summary');
    await user.click(screen.getByTestId('puck'));
    expect(saveMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'post-1',
        request: expect.objectContaining({
          culture: 'en',
          title: 'Hello',
          summary: 'A summary',
          concurrencyStamp: 'stamp-1',
        }),
      }),
      expect.anything()
    );
  });
});
