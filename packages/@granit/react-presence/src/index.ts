// Provider
export {
  PresenceProvider,
  buildPresenceQueryKey,
  usePresenceConfig,
} from './providers/presence-provider';
export type {
  PresenceConfig,
  PresenceProviderProps,
  ResolvedPresenceConfig,
} from './providers/presence-provider';

// Hooks
export { useMyPresence } from './hooks/use-my-presence';
export { useSetMyPresence } from './hooks/use-set-my-presence';
export { useClearMyPresenceOverride } from './hooks/use-clear-my-presence-override';
export { useHeartbeat } from './hooks/use-heartbeat';
export type { UseHeartbeatOptions } from './hooks/use-heartbeat';
export { useUserPresence } from './hooks/use-user-presence';
export type { UseUserPresenceOptions } from './hooks/use-user-presence';
export { useBatchPresence } from './hooks/use-batch-presence';
export type { UseBatchPresenceOptions } from './hooks/use-batch-presence';
export { presenceKeys } from './hooks/query-keys';
export { useResourcePresence } from './hooks/use-resource-presence';
export type {
  UseResourcePresenceOptions,
  UseResourcePresenceResult,
} from './hooks/use-resource-presence';

// Components
export { PresenceDot, DEFAULT_PRESENCE_COLORS } from './components/presence-dot';
export type { PresenceDotLabels, PresenceDotProps } from './components/presence-dot';
export { PresencePicker } from './components/presence-picker';
export type { PresencePickerLabels, PresencePickerProps } from './components/presence-picker';
export { DndBanner } from './components/dnd-banner';
export type { DndBannerLabels, DndBannerProps } from './components/dnd-banner';
export { PresenceHeartbeat } from './components/presence-heartbeat';
export type { PresenceHeartbeatProps } from './components/presence-heartbeat';

// Locales
export {
  presenceTranslationsEn,
  presenceTranslationsFr,
  type PresenceTranslations,
} from './locales/index';
