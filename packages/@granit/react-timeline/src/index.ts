// Provider
export {
  TimelineProvider,
  useTimelineConfig,
  buildTimelineQueryKey,
} from './providers/timeline-provider';
export type { TimelineProviderConfig, TimelineProviderProps } from './providers/timeline-provider';

// Hooks
export { useTimeline } from './hooks/use-timeline';
export type { UseTimelineOptions, UseTimelineReturn } from './hooks/use-timeline';

export { useTimelineActions } from './hooks/use-timeline-actions';
export type {
  UseTimelineActionsOptions,
  UseTimelineActionsReturn,
} from './hooks/use-timeline-actions';

export { useTimelineFollowers } from './hooks/use-timeline-followers';
export type {
  UseTimelineFollowersOptions,
  UseTimelineFollowersReturn,
} from './hooks/use-timeline-followers';

export { useToggleReaction, applyToggleResult } from './hooks/use-toggle-reaction';

export { useAnchorEntry, useUpdateEntryBody } from './hooks/use-entry-mutations';
export type { AnchorEntryVariables, UpdateEntryBodyVariables } from './hooks/use-entry-mutations';
export type { ToggleReactionVariables } from './hooks/use-toggle-reaction';

export { ReactionBar } from './components/reaction-bar';
export type { ReactionBarLabels, ReactionBarProps } from './components/reaction-bar';

// i18n resource bundles (namespace: 'timeline')
export { timelineTranslationsEn, timelineTranslationsFr } from './locales/index';
export type { TimelineTranslations } from './locales/index';

// HTTP error helper — re-exported so the UI tier narrows errors without
// depending on @granit/api-client directly (layer boundary: UI → headless).
export { isAxiosError } from '@granit/api-client';
