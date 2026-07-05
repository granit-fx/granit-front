// ─── Provider ─────────────────────────────────────────────────────────────────
export { BlogProvider, useBlogConfig } from './providers/blog-provider';
export type { BlogConfig, BlogProviderProps, ResolvedBlogConfig } from './providers/blog-provider';

// ─── Query keys ───────────────────────────────────────────────────────────────
export { blogKeys } from './hooks/query-keys';

// ─── Hooks — public ─────────────────────────────────────────────────────────---
export { usePublicPost, usePublicPosts } from './hooks/use-public-posts';
export { useBlogLatestPosts } from './hooks/use-latest-posts';

// ─── Hooks — admin (posts) ──────────────────────────────────────────────────---
export { usePost, usePostsGrid, usePostsGridMeta } from './hooks/use-posts';
export {
  useAddPostAttachment,
  useCreatePost,
  useDeletePost,
  useRemovePostAttachment,
  useReorderPostAttachments,
  useSaveDraftContent,
  useUpdatePost,
  useUpdatePostAttachment,
} from './hooks/use-post-mutations';
export {
  useCancelPostSchedule,
  usePublishPost,
  useSchedulePost,
  useUnpublishPost,
} from './hooks/use-post-lifecycle';

// ─── Hooks — admin (authors) ────────────────────────────────────────────────---
export { useAuthor, useAuthors } from './hooks/use-authors';
export { useCreateAuthor, useDeleteAuthor, useUpdateAuthor } from './hooks/use-author-mutations';

// ─── Hooks — media ────────────────────────────────────────────────────────────
export { useResolvedDocuments } from './hooks/use-blog-media';
export type { ResolvedDocumentMap } from './hooks/use-blog-media';

// ─── Blocks + Puck config ─────────────────────────────────────────────────────
export { BlogLatestPostsBlock } from './blocks/blog-latest-posts-block';
export { BLOG_BLOCK_COMPONENTS } from './blocks/registry';
export type { BlogLatestPostsBlockProps, BlogLatestPostsLayout } from './blocks/types';
export { registerBlogBlocks } from './puck/build-blog-config';
export type { RegisterBlogBlocksOptions } from './puck/build-blog-config';

// ─── Public rendering components ────────────────────────────────────────────---
export { BlogPostBody } from './components/blog-post-body';
export type { BlogPostBodyProps } from './components/blog-post-body';
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
export { BlogPostSeoHead } from './components/blog-post-seo-head';
export type { BlogPostSeoHeadProps } from './components/blog-post-seo-head';

// ─── Conflict helpers ─────────────────────────────────────────────────────────
export { extractBlogConflict, isBlogConcurrencyConflict } from './lib/extract-conflict';
export type { BlogConflict } from './lib/extract-conflict';

// ─── Constants ────────────────────────────────────────────────────────────────
export { BLOG_LATEST_POSTS_BLOCK_NAME, BLOG_LATEST_POSTS_DATA_SOURCE_KEY } from './constants';
