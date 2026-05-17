export { createLocalization } from './create-localization.js';
export { resolveInitialLocale } from './resolve-initial-locale.js';
export { applyTranslations } from './apply-translations.js';
export { unflattenKeys } from './unflatten-keys.js';
export { LOCALE_STORAGE_KEY } from './constants.js';

export type {
  AdminLanguage,
  ApplicationLocalizationDto,
  LanguageInfo,
  LocalizationConfig,
  LocalizationOverride,
  LocalizationOverrideId,
} from './types/index.js';

// API — Admin
export {
  deleteLocalizationOverride,
  listLanguages,
  setLocalizationOverride,
  updateLanguageStatus,
} from './api/localization-admin-api.js';
export { LocalizationOverridesPermissions } from './permissions.js';
