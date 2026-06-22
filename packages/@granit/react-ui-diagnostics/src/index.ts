// @granit/react-ui-diagnostics — admin UI for the Granit.Diagnostics module.
// Composes the headless @granit/react-diagnostics (useMonitoringHealth) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree.

export { DiagnosticListPage } from './diagnostic-list-page';
export { ServiceHealthCard } from './components/service-health-card';
export { AutoRefreshIndicator } from './components/auto-refresh-indicator';

// i18next resource bundles (flat keys, "translation" ns)
export { diagnosticsTranslationsEn, diagnosticsTranslationsFr } from './locales/index';
export type { DiagnosticsTranslations } from './locales/index';
