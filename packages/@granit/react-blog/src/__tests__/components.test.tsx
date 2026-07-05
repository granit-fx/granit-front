import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mockPublicPostItems } from '@granit/react-blog/testing';

import { BlogAuthorByline } from '../components/blog-author-byline';
import { BlogPostBody } from '../components/blog-post-body';
import { BlogPostCard } from '../components/blog-post-card';
import { BlogPostCover } from '../components/blog-post-cover';
import { BlogPostGallery } from '../components/blog-post-gallery';
import { BlogPostList } from '../components/blog-post-list';
import { BlogPostSeoHead } from '../components/blog-post-seo-head';

import type { EffectiveSeoResponse } from '@granit/cms-seo';
import type { Config } from '@puckeditor/core';

describe('BlogPostCard / BlogPostList', () => {
  it('renders a card with title, summary and author', () => {
    render(
      <BlogPostCard post={mockPublicPostItems[0]!} href="/blog/hello-world" authorName="Ada" />
    );
    expect(screen.getByRole('link', { name: 'Hello world' })).toBeInTheDocument();
    expect(screen.getByText('The very first post.')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('renders a list and an empty state', () => {
    const { rerender } = render(<BlogPostList posts={mockPublicPostItems} />);
    expect(screen.getByRole('link', { name: 'Hello world' })).toHaveAttribute(
      'href',
      '/blog/hello-world'
    );
    rerender(<BlogPostList posts={[]} emptyLabel="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('BlogPostCover', () => {
  it('renders nothing without a url', () => {
    const { container } = render(<BlogPostCover />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an image and caption', () => {
    render(<BlogPostCover url="https://cdn/x.jpg" alt="Cover" caption="A caption" />);
    expect(screen.getByRole('img', { name: 'Cover' })).toHaveAttribute('src', 'https://cdn/x.jpg');
    expect(screen.getByText('A caption')).toBeInTheDocument();
  });
});

describe('BlogAuthorByline', () => {
  it('renders name, bio and avatar', () => {
    render(
      <BlogAuthorByline
        displayName="Ada"
        bio="Bio text"
        avatarUrl="https://cdn/a.jpg"
        publishedAt="2026-06-05T10:00:00Z"
      />
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Bio text')).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://cdn/a.jpg');
    expect(screen.getByText('2026-06-05')).toBeInTheDocument();
  });
});

describe('BlogPostGallery', () => {
  it('renders nothing when empty and images when present', () => {
    const { container, rerender } = render(<BlogPostGallery images={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <BlogPostGallery images={[{ url: 'https://cdn/1.jpg', alt: 'One', caption: 'First' }]} />
    );
    expect(screen.getByRole('img', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
  });
});

describe('BlogPostBody', () => {
  const config = { components: {}, categories: {}, root: {} } as unknown as Config;

  it('renders nothing for invalid contentJson', () => {
    const { container } = render(<BlogPostBody contentJson="not json" config={config} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the body wrapper for valid content', () => {
    render(<BlogPostBody contentJson='{"content":[],"root":{"props":{}}}' config={config} />);
    expect(document.querySelector('[data-block="blog-post-body"]')).not.toBeNull();
  });
});

describe('BlogPostSeoHead', () => {
  const seo: EffectiveSeoResponse = {
    title: 'Hello world — Blog',
    description: 'The very first post.',
    canonicalUrl: 'https://example.com/blog/hello-world',
    robots: {
      index: true,
      follow: true,
      noArchive: false,
      noSnippet: false,
      maxSnippet: null,
      maxImagePreview: null,
    },
    keywords: ['blog', 'hello'],
    openGraph: {
      type: 'article',
      title: 'Hello world',
      description: 'The very first post.',
      url: 'https://example.com/blog/hello-world',
      siteName: 'Blog',
      locale: 'en',
      alternateLocales: [],
      image: {
        documentId: null,
        versionId: null,
        renditionId: null,
        publicLinkId: null,
        url: 'https://cdn/cover.jpg',
        dimensions: null,
        mimeType: 'image/jpeg',
        altText: 'Cover',
      },
      article: {
        author: 'Ada Lovelace',
        section: null,
        tags: [],
        publishedTime: '2026-06-05T10:00:00Z',
        modifiedTime: null,
      },
    },
    twitterCard: {
      card: 'summary_large_image',
      title: 'Hello world',
      description: 'The very first post.',
      image: null,
      site: null,
      creator: '@ada',
    },
    alternates: [{ culture: 'fr', href: 'https://example.com/fr/blog/bonjour' }],
  };

  it('emits title, robots, canonical, hreflang and JSON-LD', () => {
    render(<BlogPostSeoHead seo={seo} jsonLd='{"@type":"BlogPosting"}' />);
    expect(document.title).toBe('Hello world — Blog');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow'
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://example.com/blog/hello-world'
    );
    expect(document.querySelector('link[hreflang="fr"]')).not.toBeNull();
    expect(document.querySelector('script[type="application/ld+json"]')?.innerHTML).toContain(
      'BlogPosting'
    );
  });
});
