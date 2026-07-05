/**
 * Server-safe entry point for @granit/react-blog.
 * Only exports safe to import from React Server Components (pure functions and
 * metadata-emitting components — no client hooks or browser APIs).
 */

// Puck config composition (pure function)
export { registerBlogBlocks } from './puck/build-blog-config';
export type { RegisterBlogBlocksOptions } from './puck/build-blog-config';
export type { BlogLatestPostsBlockProps, BlogLatestPostsLayout } from './blocks/types';

// SEO head (emits <title>/<meta>/<link>/JSON-LD — React 19 hoists these)
export { BlogPostSeoHead } from './components/blog-post-seo-head';
export type { BlogPostSeoHeadProps } from './components/blog-post-seo-head';

// Presentational components (no client hooks)
export { BlogPostCard } from './components/blog-post-card';
export type { BlogPostCardProps } from './components/blog-post-card';
export { BlogPostList } from './components/blog-post-list';
export type { BlogPostListProps } from './components/blog-post-list';
export { BlogPostCover } from './components/blog-post-cover';
export type { BlogPostCoverProps } from './components/blog-post-cover';
export { BlogPostGallery } from './components/blog-post-gallery';
export type { BlogGalleryImage, BlogPostGalleryProps } from './components/blog-post-gallery';
export { BlogAuthorByline } from './components/blog-author-byline';
export type { BlogAuthorBylineProps } from './components/blog-author-byline';

// Constants
export { BLOG_LATEST_POSTS_BLOCK_NAME, BLOG_LATEST_POSTS_DATA_SOURCE_KEY } from './constants';
