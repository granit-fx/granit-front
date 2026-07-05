// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Posts — public
  BlogPostPublishedListItemResponse,
  BlogPostListResponse,
  BlogPostPublishedResponse,
  // Posts — admin
  BlogPostListItemResponse,
  BlogPostAttachmentResponse,
  BlogPostAttachmentAddRequest,
  BlogPostAttachmentDescribeRequest,
  BlogPostAttachmentReorderRequest,
  BlogPostCreateRequest,
  BlogPostDraftContentRequest,
  BlogPostDraftContentResponse,
  BlogPostResponse,
  BlogPostUpdateRequest,
  // Posts — lifecycle
  BlogPostPublicationResponse,
  BlogPostScheduleRequest,
  // Author profiles
  BlogAuthorProfileCreateRequest,
  BlogAuthorProfileResponse,
  BlogAuthorProfileUpdateRequest,
  // Blocks — blog-latest-posts
  BlogLatestPostsData,
  BlogLatestPostsItem,
  // Params
  ListBlogPostsParams,
  ListPublicPostsParams,
} from './types/index';

// ─── API — Public renderer ────────────────────────────────────────────────────
export { buildBlogFeedUrl, getPublicPostBySlug, getPublicPosts } from './api/public-posts';

// ─── API — Admin (posts) ──────────────────────────────────────────────────────
export {
  addPostAttachment,
  createPost,
  deletePost,
  getPost,
  removePostAttachment,
  reorderPostAttachments,
  saveDraftContent,
  updatePost,
  updatePostAttachment,
} from './api/posts-admin';

// ─── API — Admin (posts list) ─────────────────────────────────────────────────
export { getPostsQueryMeta, listPosts } from './api/posts-query';

// ─── API — Admin (lifecycle) ──────────────────────────────────────────────────
export {
  cancelPostSchedule,
  publishPost,
  schedulePost,
  unpublishPost,
} from './api/posts-lifecycle';

// ─── API — Admin (author profiles) ────────────────────────────────────────────
export { createAuthor, deleteAuthor, getAuthor, listAuthors, updateAuthor } from './api/authors';

// ─── Permissions ──────────────────────────────────────────────────────────────
export { BlogPermissions } from './permissions';

// ─── Validation constraints (interim — see constraints.ts) ────────────────────
export { blogConstraints } from './constraints';
