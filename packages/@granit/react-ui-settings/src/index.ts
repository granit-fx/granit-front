// @granit/react-ui-settings — admin UI for the Granit.Settings module.
// Composes the headless @granit/react-settings (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree; the settings scope (global/tenant) is injected.

export { AppSettingsEditPage } from './app-settings-edit-page';
export type { AppSettingsEditPageProps } from './app-settings-edit-page';
export { AppSettingsPanel } from './components/app-settings-panel';
export type { AppSettingsPanelProps } from './components/app-settings-panel';

// i18next resource bundles (flat keys, "translation" ns)
export { settingsTranslationsEn, settingsTranslationsFr } from './locales/index';
export type { SettingsTranslations } from './locales/index';
