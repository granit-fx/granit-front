// ---------------------------------------------------------------------------
// @granit/react-timeline — i18next resource bundles (namespace: "timeline")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { timelineTranslationsEn, timelineTranslationsFr } from '@granit/react-timeline';
//   i18n.addResourceBundle('en', 'timeline', timelineTranslationsEn);
//   i18n.addResourceBundle('fr', 'timeline', timelineTranslationsFr);
//
// Components in this package don't call `useTranslation` directly — they
// expose `labels` props that apps populate from `t()` results. This
// keeps components testable without an i18next bootstrap and consistent
// with the headless conventions across the framework.
// ---------------------------------------------------------------------------

export { timelineTranslationsEn } from './en';
export type { TimelineTranslations } from './en';
export { timelineTranslationsFr } from './fr';
