// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Posts — public
  BlogPostListItem,
  BlogPostListResponse,
  BlogPostPublishedResponse,
  // Posts — admin
  BlogPostAttachment,
  BlogPostCreateRequest,
  BlogPostDraftContentRequest,
  BlogPostDraftContentResponse,
  BlogPostAddAttachmentRequest,
  BlogPostUpdateAttachmentRequest,
  BlogPostReorderAttachmentsRequest,
  BlogPostGridRow,
  BlogPostResponse,
  BlogPostStatus,
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

// ─── API — Admin (grid) ───────────────────────────────────────────────────────
export { getPostsGridMeta, listPostsGrid } from './api/posts-grid';

// ─── API — Admin (lifecycle) ──────────────────────────────────────────────────
export {
  cancelPostSchedule,
  publishPost,
  schedulePost,
  unpublishPost,
} from './api/posts-lifecycle';

// ─── API — Admin (author profiles) ────────────────────────────────────────────
export { createAuthor, deleteAuthor, getAuthor, listAuthors, updateAuthor } from './api/authors';

// ─── Permissions & error codes ────────────────────────────────────────────────
export { BlogPermissions } from './permissions';
export { BlogErrorCodes } from './errors';
export type { BlogErrorCode } from './errors';

// ─── Validation constraints (interim — see constraints.ts) ────────────────────
export { blogConstraints } from './constraints';
