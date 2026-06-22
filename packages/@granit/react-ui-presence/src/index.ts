// @granit/react-ui-presence — admin UI for the Granit.Presence module.
// Composes the headless @granit/react-presence (useMyPresence, useBatchPresence,
// useResourcePresence, …) and @granit/react-identity (useProviderUsers) with the
// foundation UI packages. The Axios client resolves from the PresenceProvider /
// IdentityProvider in the host tree.

export { PresenceDemoPage } from './presence-demo-page';

// i18next resource bundles (flat keys, "translation" ns)
export { presenceTranslationsEn, presenceTranslationsFr } from './locales/index';
export type { PresenceTranslations } from './locales/index';
