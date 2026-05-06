// ---------------------------------------------------------------------------
// @granit/react-entities-customization — i18next resource bundles
// (namespace: "customization")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import {
//     customizationTranslationsEn,
//     customizationTranslationsFr,
//   } from '@granit/react-entities-customization';
//   i18n.addResourceBundle('en', 'customization', customizationTranslationsEn);
//   i18n.addResourceBundle('fr', 'customization', customizationTranslationsFr);
//
// Components in this package don't call `useTranslation` directly — they
// expose `labels` props that apps populate from `t()` results. Keeps the
// package headless and consistent with the rest of the framework.
// ---------------------------------------------------------------------------

export { customizationTranslationsEn } from './en.js';
export type { CustomizationTranslations } from './en.js';
export { customizationTranslationsFr } from './fr.js';
