export { aiChatTranslationsEn } from './en';
export { aiChatTranslationsFr } from './fr';
export type { ChatTranslations } from './en';

/**
 * English defaults used by components when no `labels` prop is provided, so
 * they render standalone (and tests need no i18n bootstrap). Apps register the
 * `aiChat*` bundles with i18next and pass translated labels down.
 */
export { aiChatTranslationsEn as defaultChatLabels } from './en';
