// ---------------------------------------------------------------------------
// @granit/react-entities — i18next resource bundles (namespace: "entities")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { entitiesTranslationsEn, entitiesTranslationsFr } from '@granit/react-entities';
//   i18n.addResourceBundle('en', 'entities', entitiesTranslationsEn);
//   i18n.addResourceBundle('fr', 'entities', entitiesTranslationsFr);
//
// Components in this package don't call `useTranslation` directly — they
// expose `labels` props (when needed) that apps populate from `t()`
// results. This keeps components testable without an i18next bootstrap
// and consistent with the headless conventions of the rest of the
// framework.
// ---------------------------------------------------------------------------

export { entitiesTranslationsEn } from './en.js';
export type { EntitiesTranslations } from './en.js';
export { entitiesTranslationsFr } from './fr.js';
