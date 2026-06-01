// ---------------------------------------------------------------------------
// @granit/react-activities — i18next resource bundles (namespace: "activities")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { activitiesTranslationsEn, activitiesTranslationsFr } from '@granit/react-activities';
//   i18n.addResourceBundle('en', 'activities', activitiesTranslationsEn);
//   i18n.addResourceBundle('fr', 'activities', activitiesTranslationsFr);
//
// Components in this package don't call `useTranslation` directly — they
// expose `labels` / `actionLabels` props that apps populate from `t()`.
// This keeps the components testable without i18next bootstrap, and keeps
// the framework headless: apps own when and how to mount i18n.
// ---------------------------------------------------------------------------

export { activitiesTranslationsEn } from './en';
export type { ActivitiesTranslations } from './en';
export { activitiesTranslationsFr } from './fr';
