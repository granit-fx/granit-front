/**
 * Wire-aligned permission keys for `Granit.Timeline`. Mirrors the
 * .NET registry — keep in sync with the backend module.
 */
export const TimelinePermissions = {
  Entries: {
    /** Read access to activity streams, followers, and timeline history. */
    Read: 'Timeline.Entries.Read',
    /** Create timeline entries (post comments). */
    Create: 'Timeline.Entries.Create',
    /** Soft-delete any timeline entry regardless of ownership (admin). */
    Manage: 'Timeline.Entries.Manage',
  },
  InternalNotes: {
    /** Read access to internal notes in activity streams. */
    Read: 'Timeline.InternalNotes.Read',
  },
  Followers: {
    /** Follow / unfollow entities and view follower lists. */
    Manage: 'Timeline.Followers.Manage',
  },
  Reactions: {
    /** Required to react / un-react on a timeline entry (C-stream). */
    React: 'Timeline.Reactions.React',
  },
} as const;
