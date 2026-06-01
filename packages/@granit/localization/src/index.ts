export { createLocalization } from './create-localization';
export { resolveInitialLocale } from './resolve-initial-locale';
export { applyTranslations } from './apply-translations';
export { unflattenKeys } from './unflatten-keys';
export { LOCALE_STORAGE_KEY } from './constants';

export type {
  AdminLanguage,
  ApplicationLocalizationDto,
  LanguageInfo,
  LocalizationConfig,
  LocalizationOverride,
  LocalizationOverrideId,
} from './types/index';

// API — Consumer
export { getApplicationLocalization } from './api/localization-api';

// API — Admin
export {
  deleteLocalizationOverride,
  listLanguages,
  setLocalizationOverride,
  updateLanguageStatus,
} from './api/localization-admin-api';
export { LocalizationOverridesPermissions } from './permissions';
