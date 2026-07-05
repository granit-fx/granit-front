/**
 * Domain error codes returned in the RFC 7807 problem+json `code` extension by
 * the Blog endpoints. Mirrors `Granit.Blog.*` domain exceptions. UI packages map
 * these to localized messages.
 */
export const BlogErrorCodes = {
  /** A post with the same slug already exists for the site (create/update 409). */
  PostSlugConflict: 'Granit:Blog:PostSlugConflict',
  /** Publish/schedule attempted with no draft content (422). */
  PostHasNoDraft: 'Granit:Blog:PostHasNoDraft',
  /** The draft was edited concurrently; the supplied stamp is stale (409). */
  DraftConcurrency: 'Granit:Blog:DraftConcurrency',
  /** Schedule request is invalid (past instant, bad zone, …) (422). */
  InvalidSchedule: 'Granit:Blog:InvalidSchedule',
  /** An author profile already exists for the user on this site (409). */
  AuthorProfileConflict: 'Granit:Blog:AuthorProfileConflict',
  /** Reorder body is not the exact current attachment set (422). */
  InvalidAttachmentOrder: 'Granit:Blog:InvalidAttachmentOrder',
  /** The post metadata `concurrencyStamp` is stale (409). */
  StalePost: 'Granit:Blog:StalePost',
} as const;

/** A Blog domain error code string. */
export type BlogErrorCode = (typeof BlogErrorCodes)[keyof typeof BlogErrorCodes];
