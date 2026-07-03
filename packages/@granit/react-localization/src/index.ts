export { createReactLocalization } from './create-react-localization';
export { useLocale } from './use-locale';
export type { UseLocaleOptions } from './use-locale';

// Hooks — Consumer
export { useApplicationLocalization } from './hooks/use-application-localization';
export type { UseApplicationLocalizationOptions } from './hooks/use-application-localization';

// Hooks — Admin
export {
  useDeleteLocalizationOverride,
  useSetLocalizationOverride,
} from './hooks/use-admin-localization';
export type {
  DeleteOverrideVariables,
  LocalizationAdminOptions,
  SetOverrideVariables,
} from './hooks/use-admin-localization';

// Hooks — Date formatting
export { useDateLocale } from './date-locale';
export { useDateFormatter } from './use-date-formatter';

// Hooks — Timezone
export { TimezoneProvider, useTimezone } from './use-timezone';

// Hooks — First day of week (calendar-token resolution parity)
export { FirstDayOfWeekProvider, useFirstDayOfWeek } from './use-first-day-of-week';
export type { Weekday } from './use-first-day-of-week';

// Re-export from react-i18next so apps import everything from @granit/react-localization.
export { I18nextProvider, Trans } from 'react-i18next';

// Custom useTranslation wrapper that auto-applies standard separators for
// custom namespaces when the app disables them globally. See use-translation.ts.
export { useTranslation } from './use-translation';
export { resolveLabel } from './resolve-label';
