// ---------------------------------------------------------------------------
// @granit/react-identity — i18next resource bundles (namespace: "identity")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { identityTranslationsEn, identityTranslationsFr } from '@granit/react-identity';
//   i18n.addResourceBundle('en', 'identity', identityTranslationsEn);
//   i18n.addResourceBundle('fr', 'identity', identityTranslationsFr);
//
// Components stay headless — they take `labels` props apps populate from `t()`.
// The `Device` section maps each `DeviceKind` to a localized name and provides
// the OS connector; pass them to `composeDeviceLabel` from `@granit/identity`.
// ---------------------------------------------------------------------------

export { identityTranslationsEn } from './en';
export type { IdentityTranslations } from './en';
export { identityTranslationsFr } from './fr';
