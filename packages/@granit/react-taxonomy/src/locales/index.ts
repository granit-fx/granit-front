// ---------------------------------------------------------------------------
// @granit/react-taxonomy — i18next resource bundles (namespace: "taxonomy")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { taxonomyTranslationsEn, taxonomyTranslationsFr } from '@granit/react-taxonomy';
//   i18n.addResourceBundle('en', 'taxonomy', taxonomyTranslationsEn);
//   i18n.addResourceBundle('fr', 'taxonomy', taxonomyTranslationsFr);
//
// Components in this package don't call `useTranslation` directly — they
// expose `labels` props that apps populate from `t()`. This keeps the
// components testable without i18next bootstrap, and keeps the framework
// headless: apps own when and how to mount i18n.
//
// NOTE on culture coverage: the backend ships permission labels in 18
// cultures via `PermissionGroup:Taxonomy`. Front-end packages in this repo
// uniformly ship en + fr bundles only (the Digital Dynamics product
// surface is bilingual); the backend strings reach the role editor through
// its existing localization pipeline regardless of front bundles.
// ---------------------------------------------------------------------------

export { taxonomyTranslationsEn } from './en';
export type { TaxonomyTranslations } from './en';
export { taxonomyTranslationsFr } from './fr';
