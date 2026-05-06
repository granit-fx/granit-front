/**
 * Wire-aligned permission keys for `Granit.Timeline`. Mirrors the
 * .NET registry — keep in sync with the backend module.
 */
export const TimelinePermissions = {
  Timeline: {
    /** Required to react / un-react on a timeline entry (C-stream). */
    React: 'Timeline.React',
  },
} as const;
