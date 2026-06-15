export { aiPromptsTranslationsEn } from './en';
export { aiPromptsTranslationsFr } from './fr';
export type { PromptTranslations } from './en';

/**
 * English defaults used by components when no `labels` prop is provided, so
 * they render standalone (and tests need no i18n bootstrap). Apps register the
 * `aiPrompts*` bundles with i18next and pass translated labels down.
 */
export { aiPromptsTranslationsEn as defaultPromptLabels } from './en';
