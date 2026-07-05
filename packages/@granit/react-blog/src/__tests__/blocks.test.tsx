import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mockLatestPostsData } from '@granit/react-blog/testing';

import { BlogLatestPostsBlock } from '../blocks/blog-latest-posts-block';
import { BLOG_BLOCK_COMPONENTS } from '../blocks/registry';
import { registerBlogBlocks } from '../puck/build-blog-config';

import type { Config } from '@puckeditor/core';

const baseConfig = { components: {}, categories: {} } as unknown as Config;

describe('BlogLatestPostsBlock', () => {
  it('renders a heading and post links', () => {
    render(
      <BlogLatestPostsBlock heading="Latest" layout="List" posts={mockLatestPostsData.posts} />
    );
    expect(screen.getByRole('heading', { name: 'Latest' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hello world' })).toHaveAttribute(
      'href',
      '/blog/hello-world'
    );
  });

  it('renders an empty state with no posts', () => {
    render(<BlogLatestPostsBlock posts={[]} />);
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });

  it('respects count and resolves cover urls', () => {
    render(
      <BlogLatestPostsBlock
        posts={mockLatestPostsData.posts}
        count={1}
        resolveDocumentUrl={(id) => `https://cdn/${id}.jpg`}
      />
    );
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://cdn/doc-cover-1.jpg');
  });
});

describe('BLOG_BLOCK_COMPONENTS', () => {
  it('registers the blog-latest-posts component', () => {
    expect(BLOG_BLOCK_COMPONENTS['blog-latest-posts']).toBe(BlogLatestPostsBlock);
  });
});

describe('registerBlogBlocks', () => {
  it('adds the block to components and a Blog category', () => {
    const config = registerBlogBlocks(baseConfig);
    expect(config.components['blog-latest-posts']).toBeDefined();
    expect(config.categories?.['Blog']?.components).toContain('blog-latest-posts');
  });

  it('wires resolveData to the data source when a resolver is supplied', async () => {
    const resolveBlockData = vi.fn().mockResolvedValue({
      data: mockLatestPostsData,
      consumedContentKeys: [],
    });
    const config = registerBlogBlocks(baseConfig, {
      resolveBlockData,
      siteId: 'site-1',
      culture: 'en',
    });

    const resolveData = config.components['blog-latest-posts']!.resolveData;
    expect(resolveData).toBeDefined();

    const result = await resolveData!({ props: { heading: 'H' } } as never, {} as never);
    expect(resolveBlockData).toHaveBeenCalledWith({
      dataSourceKey: 'blog.latest-posts',
      query: null,
      siteId: 'site-1',
      culture: 'en',
    });
    expect((result as { props: { posts: unknown } }).props.posts).toEqual(
      mockLatestPostsData.posts
    );
  });

  it('falls back to editor props when resolution fails', async () => {
    const resolveBlockData = vi.fn().mockRejectedValue(new Error('boom'));
    const config = registerBlogBlocks(baseConfig, { resolveBlockData });
    const resolveData = config.components['blog-latest-posts']!.resolveData!;

    const result = await resolveData({ props: { heading: 'H' } } as never, {} as never);
    expect((result as { props: { heading: string } }).props.heading).toBe('H');
  });
});
