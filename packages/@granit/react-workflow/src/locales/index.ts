// ---------------------------------------------------------------------------
// @granit/react-workflow — i18next resource bundles (namespace: "workflow")
// ---------------------------------------------------------------------------
//
// Consumers register the bundles with their i18n instance:
//
//   import { workflowTranslationsEn, workflowTranslationsFr } from '@granit/react-workflow';
//   i18n.addResourceBundle('en', 'workflow', workflowTranslationsEn);
//   i18n.addResourceBundle('fr', 'workflow', workflowTranslationsFr);
//
// `buildLifecycleTransitionPrompt` returns translation keys namespaced
// under `workflow:Transition.{From}To{To}.*` that resolve once the
// bundle is registered.

export { workflowTranslationsEn } from './en.js';
export type { WorkflowTransitionStrings, WorkflowTranslations } from './en.js';
export { workflowTranslationsFr } from './fr.js';
