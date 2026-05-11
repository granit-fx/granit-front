// ---------------------------------------------------------------------------
// @granit/react-documents — i18next resource bundles (namespace: "documents")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { documentsTranslationsEn, documentsTranslationsFr } from '@granit/react-documents';
//   i18n.addResourceBundle('en', 'documents', documentsTranslationsEn);
//   i18n.addResourceBundle('fr', 'documents', documentsTranslationsFr);
//
// The bundles are empty placeholders during the hooks-only phase; the
// components phase will populate the `DocumentsTranslations` shape.
// ---------------------------------------------------------------------------

export { documentsTranslationsEn } from './en.js';
export type { DocumentsTranslations } from './en.js';
export { documentsTranslationsFr } from './fr.js';
