// Provider
export {
  TimelineProvider,
  useTimelineConfig,
  buildTimelineQueryKey,
} from './providers/timeline-provider.js';
export type {
  TimelineProviderConfig,
  TimelineProviderProps,
} from './providers/timeline-provider.js';

// Hooks
export { useTimeline } from './hooks/use-timeline.js';
export type { UseTimelineOptions, UseTimelineReturn } from './hooks/use-timeline.js';

export { useTimelineActions } from './hooks/use-timeline-actions.js';
export type {
  UseTimelineActionsOptions,
  UseTimelineActionsReturn,
} from './hooks/use-timeline-actions.js';

export { useTimelineFollowers } from './hooks/use-timeline-followers.js';
export type {
  UseTimelineFollowersOptions,
  UseTimelineFollowersReturn,
} from './hooks/use-timeline-followers.js';

export {
  applyToggleResult,
  toggleReactionMap,
  useToggleReaction,
} from './hooks/use-toggle-reaction.js';

export { useAnchorEntry, useUpdateEntryBody } from './hooks/use-entry-mutations.js';
export type {
  AnchorEntryVariables,
  UpdateEntryBodyVariables,
} from './hooks/use-entry-mutations.js';
export type { ToggleReactionVariables } from './hooks/use-toggle-reaction.js';

export { ReactionBar } from './components/reaction-bar.js';
export type { ReactionBarLabels, ReactionBarProps } from './components/reaction-bar.js';

// i18n resource bundles (namespace: 'timeline')
export { timelineTranslationsEn, timelineTranslationsFr } from './locales/index.js';
export type { TimelineTranslations } from './locales/index.js';
