/**
 * Wire-aligned permission keys for `Granit.Timeline`. Mirrors the
 * .NET registry — keep in sync with the backend module.
 */
export const TimelinePermissions = {
  Timeline: {
    Reactions: {
      /** Required to react / un-react on a timeline entry (C-stream). */
      React: 'Timeline.Reactions.React',
    },
  },
} as const;
