// Provider
export { SettingsProvider, useSettingsConfig } from './providers/settings-provider';
export type { SettingsConfig, SettingsProviderProps } from './providers/settings-provider';

// Query key factory
export { buildSettingsQueryKey } from './hooks/query-keys';

// Hooks
export { useDeleteSetting } from './hooks/use-delete-setting';
export type { UseDeleteSettingReturn } from './hooks/use-delete-setting';
export { useSetting } from './hooks/use-setting';
export { useSettings } from './hooks/use-settings';
export { useUpdateSetting } from './hooks/use-update-setting';
export type { UseUpdateSettingReturn } from './hooks/use-update-setting';

// Hooks — Admin
export { useAdminAppSettings, useBulkUpdateSettings } from './hooks/use-admin-app-settings';
export type { BulkUpdateSettingsVariables } from './hooks/use-admin-app-settings';
