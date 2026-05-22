// Provider
export {
  PresenceProvider,
  buildPresenceQueryKey,
  usePresenceConfig,
} from './providers/presence-provider.js';
export type {
  PresenceConfig,
  PresenceProviderProps,
  ResolvedPresenceConfig,
} from './providers/presence-provider.js';

// Hooks
export { useMyPresence } from './hooks/use-my-presence.js';
export { useSetMyPresence } from './hooks/use-set-my-presence.js';
export { useClearMyPresenceOverride } from './hooks/use-clear-my-presence-override.js';
export { useHeartbeat } from './hooks/use-heartbeat.js';
export type { UseHeartbeatOptions } from './hooks/use-heartbeat.js';
export { useUserPresence } from './hooks/use-user-presence.js';
export type { UseUserPresenceOptions } from './hooks/use-user-presence.js';
export { useBatchPresence } from './hooks/use-batch-presence.js';
export type { UseBatchPresenceOptions } from './hooks/use-batch-presence.js';
export { presenceKeys } from './hooks/query-keys.js';

// Components
export { PresenceDot, DEFAULT_PRESENCE_COLORS } from './components/presence-dot.js';
export type { PresenceDotLabels, PresenceDotProps } from './components/presence-dot.js';
export { PresencePicker } from './components/presence-picker.js';
export type { PresencePickerLabels, PresencePickerProps } from './components/presence-picker.js';
export { DndBanner } from './components/dnd-banner.js';
export type { DndBannerLabels, DndBannerProps } from './components/dnd-banner.js';
export { PresenceHeartbeat } from './components/presence-heartbeat.js';
export type { PresenceHeartbeatProps } from './components/presence-heartbeat.js';

// Locales
export {
  presenceTranslationsEn,
  presenceTranslationsFr,
  type PresenceTranslations,
} from './locales/index.js';
