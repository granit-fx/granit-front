// Types
export type {
  AdminAppSetting,
  BulkSettingEntry,
  BulkSettingOutcome,
  BulkSettingResult,
  BulkUpdateSettingsRequest,
  BulkUpdateSettingsResponse,
  SettingScope,
  SettingValueKind,
  SettingValueResponse,
  SettingsMap,
  UpdateSettingValueRequest,
} from './types/index.js';

// Constants
export { SETTING_NAMES } from './constants.js';

// API
export {
  deleteSetting,
  getAdminAppSettings,
  getSetting,
  getSettings,
  saveAdminAppSettings,
  updateSetting,
} from './api/settings-api.js';
export type { AdminSettingsScope } from './api/settings-api.js';
