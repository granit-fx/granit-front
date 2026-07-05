/**
 * Permission constants for the Blog module.
 *
 * Mirrors `Granit.Blog.Endpoints.Permissions.BlogPermissions`. `Manage` grants
 * write over every post; `ManageOwn` is the least-privilege variant scoped to the
 * caller's own posts (author self-service). `Publish` is split out because a
 * publication transition changes what anonymous visitors see and carries a higher
 * blast radius than routine draft editing, so it can be audited/approved on its
 * own path.
 */
export const BlogPermissions = {
  Posts: {
    /** Read access (grid, by-id, draft content). */
    Read: 'Blog.Posts.Read',
    /** Write access over all posts (create / update / delete / draft / gallery). */
    Manage: 'Blog.Posts.Manage',
    /** Write access scoped to the caller's own posts only. */
    ManageOwn: 'Blog.Posts.ManageOwn',
    /** Publish / unpublish / schedule / cancel-schedule transitions. */
    Publish: 'Blog.Posts.Publish',
  },
  Authors: {
    /** Read author profiles. */
    Read: 'Blog.Authors.Read',
    /** Create / update / delete author profiles. */
    Manage: 'Blog.Authors.Manage',
  },
} as const;
